import { Student, ClassroomGroup, DistributionConfig } from '../types';

/**
 * Modern Fisher-Yates shuffle
 */
export function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export interface DistributionResult {
  updatedStudents: Student[];
  updatedRooms: ClassroomGroup[];
  unassignedStudents: Student[];
  stats: {
    totalStudents: number;
    assignedCount: number;
    unassignedCount: number;
    totalCapacity: number;
    roomCount: number;
  };
}

export function performRandomDistribution(
  students: Student[],
  rooms: ClassroomGroup[],
  config: DistributionConfig,
  targetLevelFilter?: string // if provided, only re-distribute this specific level
): DistributionResult {
  // Clone structures
  const updatedStudentsMap = new Map<string, Student>();
  students.forEach(s => updatedStudentsMap.set(s.id, { ...s, assignedRoomId: targetLevelFilter ? s.assignedRoomId : undefined }));

  const updatedRoomsMap = new Map<string, ClassroomGroup>();
  rooms.forEach(r => {
    const keepExisting = targetLevelFilter && r.academicLevel !== targetLevelFilter;
    updatedRoomsMap.set(r.id, {
      ...r,
      assignedStudentIds: keepExisting ? [...r.assignedStudentIds] : [],
    });
  });

  const studentsToProcess = targetLevelFilter
    ? students.filter(s => s.academicLevel === targetLevelFilter)
    : students;

  const roomsToProcess = targetLevelFilter
    ? rooms.filter(r => r.academicLevel === targetLevelFilter)
    : rooms;

  // Group students by original group to distribute them equally across rooms
  const studentsByGroup: Record<string, Student[]> = {};
  for (const s of studentsToProcess) {
    if (!studentsByGroup[s.originalGroup]) studentsByGroup[s.originalGroup] = [];
    studentsByGroup[s.originalGroup].push(s);
  }

  // Shuffle internal lists and randomize group processing order
  const shuffledGroups = shuffleArray(Object.values(studentsByGroup).map(list => shuffleArray(list)));
    
  let availableRooms = roomsToProcess.map(r => updatedRoomsMap.get(r.id)!);
  availableRooms = shuffleArray(availableRooms);
  let currIdx = 0;

  for (const groupStudents of shuffledGroups) {
    for (const student of groupStudents) {
      if (availableRooms.length === 0) break;

      const roomObj = availableRooms[currIdx];
      roomObj.assignedStudentIds.push(student.id);
      
      const stObj = updatedStudentsMap.get(student.id);
      if (stObj) {
        stObj.assignedRoomId = roomObj.id;
      }

      if (roomObj.assignedStudentIds.length >= roomObj.capacity) {
        availableRooms.splice(currIdx, 1);
        if (availableRooms.length > 0) {
          currIdx = currIdx % availableRooms.length;
        }
      } else {
        currIdx = (currIdx + 1) % availableRooms.length;
      }
    }
  }

  const finalStudents = Array.from(updatedStudentsMap.values());
  const finalRooms = Array.from(updatedRoomsMap.values());
  const unassigned = finalStudents.filter(s => !s.assignedRoomId);
  const totalCapacity = finalRooms.reduce((sum, r) => sum + r.capacity, 0);

  return {
    updatedStudents: finalStudents,
    updatedRooms: finalRooms,
    unassignedStudents: unassigned,
    stats: {
      totalStudents: finalStudents.length,
      assignedCount: finalStudents.length - unassigned.length,
      unassignedCount: unassigned.length,
      totalCapacity,
      roomCount: finalRooms.length,
    },
  };
}

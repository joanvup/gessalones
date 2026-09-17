export interface Student {
  id: string;
  name: string;
  originalGroup: string;
  academicLevel: string;
  assignedRoomId?: string;
}

export interface ClassroomGroup {
  id: string;
  name: string;
  director: string;
  capacity: number;
  academicLevel: string;
  assignedStudentIds: string[];
}

export interface DistributionConfig {
  balanceOriginalGroups: boolean;
  seed?: number;
}

export interface FileParseResult<T> {
  data: T[];
  errors: string[];
  warnings: string[];
  columnsDetected: string[];
}

export interface DetailedReportData {
  generatedAt: string;
  totalStudents: number;
  totalRooms: number;
  totalCapacity: number;
  capacityUtilization: number;
  levels: {
    levelName: string;
    studentsCount: number;
    roomsCount: number;
    capacity: number;
  }[];
  rooms: {
    roomName: string;
    director: string;
    academicLevel: string;
    targetCapacity: number;
    assignedCount: number;
    students: Student[];
  }[];
}

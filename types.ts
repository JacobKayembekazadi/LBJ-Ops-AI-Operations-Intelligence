
export enum TeamRole {
  DESIGN = 'Design',
  BUILD = 'Build',
  MAINTENANCE = 'Maintenance'
}

export enum ProjectStatus {
  PLANNING = 'Planning',
  IN_PROGRESS = 'In Progress',
  STALLED = 'Stalled',
  COMPLETED = 'Completed'
}

export interface Project {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: ProjectStatus;
  team: TeamRole;
  priority: 'Low' | 'Medium' | 'High';
}

export interface TeamAvailability {
  role: TeamRole;
  capacity: number; // 0-100
  headcount: number;
}

export interface InventoryItem {
  name: string;
  quantity: number;
  unit: string;
  status: 'Critical' | 'Low' | 'Adequate';
}

export interface Deliverable {
  id: string;
  title: string;
  date: string;
  content: string;
}

export interface AppState {
  projects: Project[];
  availability: TeamAvailability[];
  inventory: InventoryItem[];
}

export interface Asset {
  id: string;
  fieldValues: {
    '/text': string;
    '/attributes/@ast01': string; // Asset Type
    '/attributes/@ast02': string; // Location
    '/attributes/@ast03': string; // Model/Serial
    '/attributes/@ast04': string; // Last Service Date
    '/attributes/@ast05': string; // Next Service Date
    '/attributes/@ast06': 'opt-due' | 'opt-upcoming' | 'opt-completed'; // Status
    '/attributes/@ast07': number; // Service Interval (Days)
    '/attributes/note'?: string;
  };
  parentId: string | null;
}

export interface ServiceRecord {
  id: string;
  fieldValues: {
    '/text': string;
    '/attributes/@srv01': string; // Asset Name
    '/attributes/@srv02': string | { type: 'DateTime'; dateTime: { date: string } }; // Service Date
    '/attributes/@srv03': string; // Technician
    '/attributes/@srv04': 'opt-preventive' | 'opt-repair' | 'opt-inspection' | { type: 'Select'; optionId: string }; // Service Type
    '/attributes/@srv05': number; // Cost
    '/attributes/note'?: string;
  };
  parentId: string | null;
}

export type StatusType = 'opt-due' | 'opt-upcoming' | 'opt-completed';
export type ServiceType = 'opt-preventive' | 'opt-repair' | 'opt-inspection';

export enum RegistrationType {
  "None" = "None",
  "Booked" = "Booked",
  "Registered" = "Registered",
  "Transfered" = "Transfered",
  "Reverted" = "Reverted",
}

export enum TerminationType {
  "None" = "None",
  "Terminated" = "Terminated",
}

export interface AXRegistration {
  StudentCode?: string;
  RegistrationDate?: string;
  ActualStartDate?: string;
  ActualEndDate?: string;
  StudentType?: string;
  RegistrationStatus?: RegistrationType;
  TerminationStatus?: TerminationType;
  RegisPreviousClass?: string;
  TransferedFrom?: string;
}

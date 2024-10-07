export enum RegistrationType {
  "None" = "None",
  "Booked" = "Booked",
  "Registered" = "Registered",
  "Transfered" = "Transfered",
  "Reverted" = "Reverted",
  "Observe" = "Observe",
}

export enum TerminationType {
  "None" = "None",
  "Terminated" = "Terminated",
}

export interface AXRegistration {
  Registration?: string;
  StudentCode?: string;
  RegistrationDate?: string;
  ActualStartDate?: string;
  ActualEndDate?: string;
  StudentType?: string;
  RegistrationStatus?: RegistrationType;
  RegistrationType?: string;
  TerminationStatus?: TerminationType;
  RegisPreviousClass?: string;
  TransferedFrom?: string;
}

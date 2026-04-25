export type Invitation = {
  id: string;
  manager: string;
  tournament: number;
  duration: number;
  participate?: boolean;
};

export type InvitationState = {
  invitations: Invitation[];
};

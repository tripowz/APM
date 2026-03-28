export type CurrentAppUser = {
  id: string;
  email: string;
  fullName: string;
  role: "owner" | "member";
};

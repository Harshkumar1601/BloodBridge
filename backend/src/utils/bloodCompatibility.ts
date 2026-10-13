// Blood Compatibility Matrix
// Key: recipient blood group
// Value: array of compatible donor blood groups

export const COMPATIBILITY_MAP: Record<string, string[]> = {
  'A+':  ['A+', 'A-', 'O+', 'O-'],
  'A-':  ['A-', 'O-'],
  'B+':  ['B+', 'B-', 'O+', 'O-'],
  'B-':  ['B-', 'O-'],
  'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
  'AB-': ['A-', 'B-', 'AB-', 'O-'],
  'O+':  ['O+', 'O-'],
  'O-':  ['O-'],
};

// What blood groups can a donor donate to
export const DONOR_TO_MAP: Record<string, string[]> = {
  'O-':  ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
  'O+':  ['A+', 'B+', 'AB+', 'O+'],
  'A-':  ['A+', 'A-', 'AB+', 'AB-'],
  'A+':  ['A+', 'AB+'],
  'B-':  ['B+', 'B-', 'AB+', 'AB-'],
  'B+':  ['B+', 'AB+'],
  'AB-': ['AB+', 'AB-'],
  'AB+': ['AB+'],
};

export function getCompatibleDonors(recipientGroup: string): string[] {
  return COMPATIBILITY_MAP[recipientGroup] || [];
}

export function canDonateToRecipient(donorGroup: string, recipientGroup: string): boolean {
  const compatible = COMPATIBILITY_MAP[recipientGroup] || [];
  return compatible.includes(donorGroup);
}

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;
export type BloodGroup = typeof BLOOD_GROUPS[number];

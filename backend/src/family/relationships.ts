import { type FamilyRole } from "../db/schema";

/**
 * Relationship wording (Stage 1 definition, consumed by the AI in Stage 4).
 *
 * THE one map from (viewer role → subject role) to how the agent refers to
 * the subject. Nothing outside this file may hardcode "your son", "your
 * mother", "your husband" etc. Self-reference resolves to "you".
 */


const CHILD_OF: Record<string, string> = {
  Mum: "your mum",
  Dad: "your dad",
  Spouse: "your parent",
  Grandparent: "your grandparent",
  Child: "your sibling",
  Other: "your family member",
};

const PARENT_OF: Record<string, string> = {
  Mum: "your wife",
  Dad: "your husband",
  Spouse: "your spouse",
  Grandparent: "your parent",
  Child: "your child",
  Other: "your family member",
};

function pairWord(viewer: FamilyRole, subject: FamilyRole): string {
  if (viewer === subject) {
    switch (viewer) {
      case "Mum": return "your fellow mum";
      case "Dad": return "your fellow dad";
      case "Spouse": return "your spouse";
      case "Child": return "your sibling";
      case "Grandparent": return "your fellow grandparent";
      default: return "your family member";
    }
  }
  // Viewer is the parent generation
  if (viewer === "Mum" || viewer === "Dad") {
    if (subject === "Child") return "your son or daughter";
    if (subject === "Mum" || subject === "Dad" || subject === "Spouse") return PARENT_OF[subject];
    if (subject === "Grandparent") return "your parent";
    return "your family member";
  }
  // Viewer is the child generation
  if (viewer === "Child") return CHILD_OF[subject] ?? "your family member";
  // Viewer is grandparent generation
  if (viewer === "Grandparent") {
    if (subject === "Child") return "your grandchild";
    return PARENT_OF[subject] ?? "your family member";
  }
  // Viewer is spouse/other
  if (viewer === "Spouse") {
    if (subject === "Child") return "your child";
    return PARENT_OF[subject] ?? "your family member";
  }
  return "your family member";
}

export function relationshipWord(viewer: FamilyRole | null, subject: FamilyRole | null): string {
  if (!viewer || !subject) return "your family member";
  return pairWord(viewer, subject);
}

/** "Mum" → "mother" style noun for templates that need it. */
export function roleNoun(role: FamilyRole | null): string {
  switch (role) {
    case "Mum": return "mother";
    case "Dad": return "father";
    case "Spouse": return "spouse";
    case "Child": return "child";
    case "Grandparent": return "grandparent";
    default: return "family member";
  }
}

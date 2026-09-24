import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radii, semantic, spacing } from "@tokens";
import { font, linearGradient } from "@rn/theme";
import { useAuth } from "@app/hooks/useAuth";
import { setBandConnected } from "@/lib/band";

import { Atmosphere } from "@/ui/Atmosphere";
import { BrandMark } from "@/ui/BrandMark";
import { AgentOrb } from "@/ui/AgentOrb";
import { Screen } from "@/ui/Screen";
import { ChevronRightIcon, HeartIcon, SparkIcon, SpeakerIcon, WatchIcon, PersonIcon, CheckIcon } from "@/icons";
import { savePlan, type PlanType, type FamilyRole, type AccountRole } from "@/lib/plan";
import { familyGroupService, type GroupMember } from "@app/services/family.service";

/**
 * What a new patient sees between signing up and arriving at Home.
 *
 * A brand-new account is empty — no vitals, no appointments — and an empty
 * Home screen explains nothing. These two steps exist to say what the app is
 * for and to offer the one piece of setup that actually matters. Both are
 * skippable: someone who just wants to look around should never be trapped in
 * a setup wizard.
 */
/**
 * What a new patient sees between signing up and arriving at Home.
 *
 * A stepper, skippable at every step: Welcome → Plan → Roles → Band.
 * The Plan step doubles as the demo — a long comparison of Individual vs
 * Family, so the choice is made looking at the thing, not at two buttons.
 * Roles only appear for the family plan: who this account is for, then the
 * members registering alongside. The choice is stored on-device for now;
 * the server-side family group joins with the family-plan backend.
 */
export default function Onboarding() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [connecting, setConnecting] = useState(false);
  const [plan, setPlan] = useState<PlanType>("individual");
  const [role, setRole] = useState<AccountRole>("Just me");
  /** Server group once created (family only). Null = not created yet. */
  const [groupId, setGroupId] = useState<string | null>(null);
  const [groupError, setGroupError] = useState<string | null>(null);
  const [creatingGroup, setCreatingGroup] = useState(false);

  const finish = () => router.replace("/home");

  /**
   * The wearable step is a stand-in.
   *
   * There is no device to pair with yet, so this sets the expectation and
   * pauses long enough to feel like something happened. It deliberately does
   * not invent data — a new account stays empty, which is the state the app
   * has to present well.
   */
  const connect = () => {
    setConnecting(true);
    /* Records the pairing before leaving, so the feed starts for this account
       and the patient does not have to connect a second time. */
    const id = user?.profile?.id;
    setTimeout(async () => {
      if (id) await setBandConnected(id, true);
      await savePlan({ type: plan, role: plan === "family" && role === "Just me" ? "Unspecified" : role, members: [] });
      finish();
    }, 1400);
  };

  const skipAll = async () => {
    await savePlan({ type: plan, role, members: [] });
    finish();
  };

  /** Every exit leaves deterministic state: skips keep whatever was chosen. */
  const skipStep = async () => {
    await savePlan({
      type: plan,
      role: plan === "family" && role === "Just me" ? "Unspecified" : role,
      members: [],
    });
    finish();
  };

  /** Family role confirmed → the server group exists from here on. */
  const createFamilySpace = async () => {
    if (role === "Just me" || !isFamilyRole(role)) return;
    setCreatingGroup(true);
    setGroupError(null);
    try {
      const g = await familyGroupService.create(role);
      setGroupId(g.group.id);
    } catch (e: any) {
      setGroupError(e?.message ?? "Couldn't create the family space. Try again.");
    } finally {
      setCreatingGroup(false);
    }
  };

  const steps = ["Welcome", "Plan", plan === "family" ? "Family" : "You", "Band"];

  if (step === 0) {
    return <Welcome name={user?.firstName} onNext={() => setStep(1)} onSkip={skipStep} />;
  }

  if (step === 1) {
    return (
      <StepperShell steps={steps} index={1} onBack={() => setStep(0)} onSkip={skipStep}>
        <PlanStep value={plan} onChange={setPlan} onNext={() => setStep(2)} />
      </StepperShell>
    );
  }

  if (step === 2) {
    return (
      <StepperShell steps={steps} index={2} onBack={() => setStep(1)} onSkip={skipStep}>
        <RolesStep
          plan={plan}
          role={role}
          onRole={setRole}
          groupId={groupId}
          groupError={groupError}
          creatingGroup={creatingGroup}
          onCreateGroup={createFamilySpace}
          onNext={() => setStep(3)}
        />
      </StepperShell>
    );
  }

  return (
    <Wearable
      onConnect={connect}
      connecting={connecting}
      onSkip={skipAll}
      onBack={() => setStep(2)}
      plan={plan}
      role={role}
      groupId={groupId}
    />
  );
}

function isFamilyRole(r: AccountRole): r is FamilyRole {
  return r !== "Just me" && r !== "Unspecified";
}

/* ------------------------------------------------------------------ */

function StepperShell({
  steps,
  index,
  onBack,
  onSkip,
  children,
}: {
  steps: string[];
  index: number;
  onBack: () => void;
  onSkip: () => void;
  children: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Atmosphere>
      <Screen contentContainerStyle={{ paddingTop: Math.max(insets.top, spacing.lg) }}>
        <View style={styles.stepRow}>
          <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="Back" style={styles.stepBack}>
            <Text style={styles.backLabel}>Back</Text>
          </Pressable>
          <View style={styles.dots}>
            {steps.map((s, i) => (
              <View key={s} style={[styles.dot, i === index ? styles.dotOn : i < index ? styles.dotDone : null]} />
            ))}
          </View>
          <Pressable onPress={onSkip} accessibilityRole="button" style={styles.stepBack}>
            <Text style={styles.skipLabel}>Skip</Text>
          </Pressable>
        </View>
        <Text style={styles.stepName}>
          Step {index + 1} of {steps.length} — {steps[index]}
        </Text>
        {children}
      </Screen>
    </Atmosphere>
  );
}

/* ------------------------------------------------------------------ */

/**
 * The plan demo: Individual vs Family as a long comparison, not two buttons.
 * The patient picks looking at what each plan actually contains.
 */
function PlanStep({ value, onChange, onNext }: { value: PlanType; onChange: (p: PlanType) => void; onNext: () => void }) {
  const cards: { type: PlanType; title: string; price: string; blurb: string; points: string[] }[] = [
    {
      type: "individual",
      title: "Individual",
      price: "Just you",
      blurb: "Your own private care space.",
      points: ["Your vitals, trends and score", "Health Agent answers about you", "Your appointments and prescriptions", "Private — nobody else sees in"],
    },
    {
      type: "family",
      title: "Family",
      price: "Everyone together",
      blurb: "One care space for the whole household.",
      points: [
        "Everyone sees everyone's vitals",
        "Mum, Dad, children, spouses — all visible",
        "Ask the agent about anyone, from your side",
        "One bell for every family alert",
        "Caregiver alerts with consent",
      ],
    },
  ];

  return (
    <View>
      <Text style={styles.heroTitle}>Who is this for?</Text>
      <Text style={styles.heroBody}>Pick the plan that fits. You can change this later.</Text>

      <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
        {cards.map((c) => {
          const on = value === c.type;
          return (
            <Pressable key={c.type} onPress={() => onChange(c.type)} accessibilityRole="button" accessibilityState={{ selected: on }}>
              <View style={[styles.planCard, on ? styles.planCardOn : null]}>
                <View style={styles.planHead}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.planTitle}>{c.title}</Text>
                    <Text style={styles.planPrice}>{c.price}</Text>
                  </View>
                  <View style={[styles.radio, on ? styles.radioOn : null]}>
                    {on ? <CheckIcon size={14} color={colors.onGreen} /> : null}
                  </View>
                </View>
                <Text style={styles.planBlurb}>{c.blurb}</Text>
                {c.points.map((p) => (
                  <View key={p} style={styles.planPoint}>
                    <CheckIcon size={13} color={semantic.accentDeep} />
                    <Text style={styles.planPointText}>{p}</Text>
                  </View>
                ))}
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={{ marginTop: spacing.lg }}>
        <Pressable onPress={onNext} accessibilityRole="button">
          <LinearGradient {...linearGradient("buttonPrimary")} style={styles.primary}>
            <Text style={styles.primaryLabel}>Continue</Text>
            <ChevronRightIcon size={17} color={colors.onGreen} />
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */

/** Who is registering — yourself, then the household alongside you. */
const ROLE_OPTIONS: FamilyRole[] = ["Mum", "Dad", "Spouse", "Child", "Grandparent", "Other"];

function RolesStep({
  plan,
  role,
  onRole,
  groupId,
  groupError,
  creatingGroup,
  onCreateGroup,
  onNext,
}: {
  plan: PlanType;
  role: AccountRole;
  onRole: (r: AccountRole) => void;
  groupId: string | null;
  groupError: string | null;
  creatingGroup: boolean;
  onCreateGroup: () => void;
  onNext: () => void;
}) {
  const [contact, setContact] = useState("");
  const [memberRole, setMemberRole] = useState<FamilyRole>("Child");
  const [invites, setInvites] = useState<{ role: string; status: string; invitedContact: string | null }[]>([]);
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const sendInvite = async () => {
    const clean = contact.trim().toLowerCase().slice(0, 80);
    if (!clean || !groupId || inviting) return;
    setInviting(true);
    setInviteError(null);
    try {
      const row = await familyGroupService.invite(groupId, clean, memberRole);
      setInvites((prev) => [...prev, row]);
      setContact("");
    } catch (e: any) {
      setInviteError(e?.message ?? "Couldn't send the invite.");
    } finally {
      setInviting(false);
    }
  };

  const rolePicked = role !== "Just me" && role !== "Unspecified";

  return (
    <View>
      <Text style={styles.heroTitle}>{plan === "family" ? "Who is this account for?" : "And you are?"}</Text>
      <Text style={styles.heroBody}>
        {plan === "family"
          ? "The agent uses this so it talks about everyone from your side."
          : "Just so the agent knows who it's talking to."}
      </Text>

      <View style={styles.chipWrap}>
        {(plan === "family" ? ROLE_OPTIONS : ["Just me", ...ROLE_OPTIONS]).map((r) => {
          const on = role === r;
          return (
            <Pressable key={r} onPress={() => onRole(r as AccountRole)} accessibilityRole="button" accessibilityState={{ selected: on }}>
              <View style={[styles.chip, on ? styles.chipOn : null]}>
                <Text style={[styles.chipLabel, on ? styles.chipLabelOn : null]}>{r}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      {plan === "family" && rolePicked && !groupId ? (
        <View style={{ marginTop: spacing.lg }}>
          {groupError ? <Text style={styles.inlineError}>{groupError}</Text> : null}
          <Pressable onPress={onCreateGroup} disabled={creatingGroup} accessibilityRole="button">
            <LinearGradient {...linearGradient("buttonPrimary")} style={[styles.primary, { opacity: creatingGroup ? 0.6 : 1 }]}>
              <Text style={styles.primaryLabel}>{creatingGroup ? "Creating family space…" : "Create family space"}</Text>
              {!creatingGroup ? <ChevronRightIcon size={17} color={colors.onGreen} /> : null}
            </LinearGradient>
          </Pressable>
          <Text style={styles.hint}>This creates your household on the server. Members join by invite only.</Text>
        </View>
      ) : null}

      {plan === "family" && groupId ? (
        <View style={{ marginTop: spacing.lg }}>
          <Text style={styles.sectionTitle}>Invite your family</Text>
          <Text style={styles.hint}>Their email or phone number. They register or sign in, and join automatically — a typed name alone creates nothing.</Text>
          {invites.map((m, i) => (
            <View key={`${m.invitedContact ?? "active"}-${i}`} style={styles.memberRow}>
              <LinearGradient {...linearGradient("tile")} style={styles.memberIcon}>
                <PersonIcon size={16} color={semantic.accentDeep} />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={styles.memberName}>{m.invitedContact ?? "Joined"}</Text>
                <Text style={styles.memberRole}>{m.role} · {m.status === "active" ? "Joined" : "Invited"}</Text>
              </View>
            </View>
          ))}

          <View style={styles.addRow}>
            <TextInput
              value={contact}
              onChangeText={setContact}
              placeholder="Email or phone"
              placeholderTextColor={semantic.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.nameInput}
            />
            <Pressable onPress={sendInvite} disabled={!contact.trim() || inviting} accessibilityRole="button" style={[styles.addBtn, { opacity: contact.trim() && !inviting ? 1 : 0.5 }]}>
              <Text style={styles.addBtnLabel}>{inviting ? "…" : "Invite"}</Text>
            </Pressable>
          </View>
          {inviteError ? <Text style={styles.inlineError}>{inviteError}</Text> : null}
          <View style={styles.chipWrap}>
            {ROLE_OPTIONS.map((r) => {
              const on = memberRole === r;
              return (
                <Pressable key={r} onPress={() => setMemberRole(r)} accessibilityRole="button" accessibilityState={{ selected: on }}>
                  <View style={[styles.chip, styles.chipSm, on ? styles.chipOn : null]}>
                    <Text style={[styles.chipLabel, styles.chipLabelSm, on ? styles.chipLabelOn : null]}>{r}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      <View style={{ marginTop: spacing.lg }}>
        <Pressable
          onPress={onNext}
          disabled={plan === "family" && rolePicked && !groupId}
          accessibilityRole="button"
        >
          <LinearGradient {...linearGradient("buttonPrimary")} style={[styles.primary, { opacity: plan === "family" && rolePicked && !groupId ? 0.5 : 1 }]}>
            <Text style={styles.primaryLabel}>Continue</Text>
            <ChevronRightIcon size={17} color={colors.onGreen} />
          </LinearGradient>
        </Pressable>
        {plan === "family" && !rolePicked ? (
          <Text style={styles.hint}>Pick who you are, or continue without — you can set it later.</Text>
        ) : null}
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */

function Welcome({ name, onNext, onSkip }: { name?: string; onNext: () => void; onSkip: () => void }) {
  const insets = useSafeAreaInsets();

  const points = [
    {
      Icon: HeartIcon,
      title: "Your vitals, as they happen",
      body: "Heart rate, blood pressure and oxygen, tracked over time rather than one number at a time.",
    },
    {
      Icon: SparkIcon,
      title: "An agent that watches for you",
      body: "It reads your trends and tells you when something is worth a look — in plain language.",
    },
    {
      Icon: SpeakerIcon,
      title: "Ask anything, any time",
      body: "Book a visit, check a prescription, or just ask what a reading means.",
    },
  ];

  return (
    <Atmosphere>
      <Screen contentContainerStyle={{ paddingTop: Math.max(insets.top, spacing.lg) }}>
        <View style={styles.hero}>
          <LinearGradient {...linearGradient("iconGreen")} style={styles.mark}>
            <BrandMark size={26} color={colors.onGreen} />
          </LinearGradient>
          <Text style={styles.heroTitle}>{name ? `Welcome, ${name}.` : "Welcome."}</Text>
          <Text style={styles.heroBody}>MicroHealth keeps an eye on your readings so nothing creeps up unnoticed.</Text>
        </View>

        <View style={{ marginTop: spacing.xl, gap: spacing.md }}>
          {points.map(({ Icon, title, body }) => (
            <View key={title} style={styles.point}>
              <LinearGradient
                {...linearGradient("tile")}
                style={[styles.pointIcon, { borderColor: "rgba(196,224,233,0.9)" }]}
              >
                <Icon size={18} color={semantic.accentDeep} />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={styles.pointTitle}>{title}</Text>
                <Text style={styles.pointBody}>{body}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ marginTop: spacing.xl }}>
          <Pressable onPress={onNext} accessibilityRole="button">
            <LinearGradient {...linearGradient("buttonPrimary")} style={styles.primary}>
              <Text style={styles.primaryLabel}>Get started</Text>
              <ChevronRightIcon size={17} color={colors.onGreen} />
            </LinearGradient>
          </Pressable>
          <Pressable onPress={onSkip} accessibilityRole="button" style={styles.skip}>
            <Text style={styles.skipLabel}>Skip for now</Text>
          </Pressable>
        </View>
      </Screen>
    </Atmosphere>
  );
}

/* ------------------------------------------------------------------ */

function Wearable({
  onConnect,
  connecting,
  onSkip,
  onBack,
  plan,
  role,
  groupId,
}: {
  onConnect: () => void;
  connecting: boolean;
  onSkip: () => void;
  onBack: () => void;
  plan: PlanType;
  role: AccountRole;
  groupId: string | null;
}) {
  const insets = useSafeAreaInsets();
  const [household, setHousehold] = useState<GroupMember[]>([]);
  const { user } = useAuth();
  const myPatientId = user?.profile?.id ?? null;

  useEffect(() => {
    if (plan === "family" && groupId) {
      familyGroupService.members(groupId).then(setHousehold).catch(() => {});
    }
  }, [plan, groupId]);

  return (
    <Atmosphere>
      <Screen contentContainerStyle={{ paddingTop: Math.max(insets.top, spacing.lg) }}>
        <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="Back" style={styles.back}>
          <Text style={styles.backLabel}>Back</Text>
        </Pressable>

        <View style={styles.hero}>
          <View style={styles.orbWrap}>
            <AgentOrb size={96} mood={connecting ? "thinking" : "idle"} />
          </View>
          <Text style={styles.heroTitle}>Connect the MicroHealth Band</Text>
          <Text style={styles.heroBody}>
            The band measures in the background so you don't have to remember to. You can add one later from your
            profile.
          </Text>
        </View>

        <View style={styles.bandCard}>
          <LinearGradient
            {...linearGradient("tile")}
            style={[styles.bandIcon, { borderColor: "rgba(196,224,233,0.9)" }]}
          >
            <WatchIcon size={22} color={semantic.accentDeep} />
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={styles.bandTitle}>MicroHealth Band</Text>
            <Text style={styles.bandBody}>
              {connecting ? "Looking for a band nearby…" : "Make sure it's charged and nearby."}
            </Text>
          </View>
        </View>

        <View style={{ marginTop: spacing.xl }}>
          <Pressable onPress={onConnect} disabled={connecting} accessibilityRole="button">
            <LinearGradient
              {...linearGradient("buttonPrimary")}
              style={[styles.primary, { opacity: connecting ? 0.6 : 1 }]}
            >
              <Text style={styles.primaryLabel}>{connecting ? "Connecting…" : "Connect band"}</Text>
            </LinearGradient>
          </Pressable>
          <Pressable onPress={onSkip} accessibilityRole="button" style={styles.skip}>
            <Text style={styles.skipLabel}>I'll do this later</Text>
          </Pressable>
        </View>

        {/* Family setup receipt: you, plus every invite and its state. */}
        {plan === "family" && groupId ? (
          <View style={styles.setupCard}>
            <Text style={styles.sectionTitle}>Family setup</Text>
            <SetupRow label="You" sub={String(role)} state="✓" />
            {household
              .filter((m) => m.patientId !== myPatientId)
              .map((m) => (
              <SetupRow
                key={m.membershipId}
                label={m.firstName ? `${m.firstName}${m.lastName ? ` ${m.lastName}` : ""}` : m.role}
                sub={m.role}
                state={m.status === "active" ? "✓ Joined" : "… Invited"}
              />
            ))}
            {household.filter((m) => m.patientId !== myPatientId).length === 0 ? (
              <Text style={styles.hint}>No invites sent yet — you can invite from Family later.</Text>
            ) : null}
          </View>
        ) : null}
      </Screen>
    </Atmosphere>
  );
}

function SetupRow({ label, sub, state }: { label: string; sub: string; state: string }) {
  return (
    <View style={styles.setupRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.memberName}>{label}</Text>
        <Text style={styles.memberRole}>{sub}</Text>
      </View>
      <Text style={styles.setupState}>{state}</Text>
    </View>
  );
}

/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  hero: { alignItems: "center", marginTop: spacing.lg },
  mark: { width: 52, height: 52, borderRadius: radii.pill, alignItems: "center", justifyContent: "center" },
  orbWrap: { transform: [{ scale: 0.95 }] },
  heroTitle: {
    fontSize: 23,
    ...font(700),
    lineHeight: 30,
    letterSpacing: -0.02 * 23,
    color: semantic.textPrimary,
    textAlign: "center",
    marginTop: spacing.md,
  },
  heroBody: {
    fontSize: 14,
    lineHeight: 21,
    color: semantic.textSecondary,
    textAlign: "center",
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
  },

  point: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  pointIcon: { width: 38, height: 38, borderRadius: radii.pill, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  pointTitle: { fontSize: 14.5, ...font(600), lineHeight: 21, color: semantic.textPrimary },
  pointBody: { fontSize: 13, lineHeight: 19.5, color: semantic.textSecondary, marginTop: 2 },

  bandCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.xl,
    padding: spacing.md,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: "rgba(226,236,231,0.9)",
    backgroundColor: colors.surface,
  },
  bandIcon: { width: 44, height: 44, borderRadius: radii.pill, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  bandTitle: { fontSize: 14, ...font(600), lineHeight: 21, color: semantic.textPrimary },
  bandBody: { fontSize: 12.5, lineHeight: 19, color: semantic.textSecondary, marginTop: 1 },

  primary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 15,
    borderRadius: radii.pill,
  },
  primaryLabel: { fontSize: 15, ...font(600), lineHeight: 21, color: colors.onGreen },
  skip: { alignItems: "center", paddingVertical: spacing.sm, marginTop: 4 },
  skipLabel: { fontSize: 13.5, ...font(500), lineHeight: 20, color: semantic.textSecondary },

  back: { alignSelf: "flex-start", paddingVertical: 6 },
  backLabel: { fontSize: 14, ...font(500), lineHeight: 21, color: semantic.accentDeep },

  /* Stepper chrome */
  stepRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  stepBack: { paddingVertical: 6, minWidth: 52 },
  dots: { flexDirection: "row", gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#CBD5E1" },
  dotDone: { backgroundColor: "#86BFCB" },
  dotOn: { width: 22, backgroundColor: colors.green600 },
  stepName: { fontSize: 12, ...font(500), lineHeight: 16, color: semantic.textMuted, marginTop: 4 },

  /* Plan cards */
  planCard: {
    padding: spacing.md,
    borderRadius: radii.card,
    borderWidth: 1.5,
    borderColor: "rgba(226,236,231,0.9)",
    backgroundColor: colors.surface,
  },
  planCardOn: { borderColor: colors.green600, backgroundColor: "#F2FAF5" },
  planHead: { flexDirection: "row", alignItems: "center" },
  planTitle: { fontSize: 17, ...font(700), lineHeight: 24, color: semantic.textPrimary },
  planPrice: { fontSize: 13, ...font(500), lineHeight: 18, color: semantic.accentDeep, marginTop: 2 },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  radioOn: { borderColor: colors.green600, backgroundColor: colors.green600 },
  planBlurb: { fontSize: 13, lineHeight: 19, color: semantic.textSecondary, marginTop: 6 },
  planPoint: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  planPointText: { flex: 1, fontSize: 13.5, lineHeight: 20, color: semantic.textPrimary },

  /* Role chips */
  sectionTitle: { fontSize: 14, ...font(600), lineHeight: 20, color: semantic.textPrimary, marginBottom: spacing.xs },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: spacing.sm },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: "rgba(133,192,206,0.65)",
    backgroundColor: colors.surface,
  },
  chipOn: { borderColor: colors.green600, backgroundColor: colors.green600 },
  chipLabel: { fontSize: 13.5, ...font(600), lineHeight: 19, color: semantic.textPrimary },
  chipLabelOn: { color: colors.onGreen },
  chipSm: { paddingHorizontal: 11, paddingVertical: 7 },
  chipLabelSm: { fontSize: 12.5, lineHeight: 17 },

  /* Member rows */
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radii.small,
    borderWidth: 1,
    borderColor: "rgba(226,236,231,0.9)",
    backgroundColor: colors.surface,
    marginBottom: 8,
  },
  memberIcon: { width: 38, height: 38, borderRadius: radii.pill, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  memberName: { fontSize: 14, ...font(600), lineHeight: 20, color: semantic.textPrimary },
  memberRole: { fontSize: 12.5, lineHeight: 17, color: semantic.textSecondary },
  remove: { fontSize: 12.5, ...font(600), lineHeight: 17, color: colors.error },
  addRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  nameInput: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: semantic.textPrimary,
    backgroundColor: colors.surface,
    borderRadius: radii.control,
    borderWidth: 1,
    borderColor: "#E0E6EC",
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  addBtn: { paddingHorizontal: 18, justifyContent: "center", borderRadius: radii.pill, backgroundColor: colors.green600 },
  addBtnLabel: { fontSize: 14, ...font(600), lineHeight: 20, color: colors.onGreen },
  hint: { fontSize: 12.5, lineHeight: 18, color: semantic.textMuted, marginTop: spacing.xs },
  inlineError: { fontSize: 13, lineHeight: 19, color: colors.error, marginBottom: spacing.xs },

  setupCard: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: "rgba(226,236,231,0.9)",
    backgroundColor: colors.surface,
  },
  setupRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: 8 },
  setupState: { fontSize: 12.5, ...font(600), lineHeight: 17, color: semantic.accentDeep },
});

import { requireSession } from "@/lib/auth";
import { ActionForm, SubmitButton } from "@/components/dashboard/ActionForm";
import { BecomeOrganizer } from "@/components/dashboard/BecomeOrganizer";
import { becomeOrganizer, updateProfile } from "../actions";

export default async function ProfilePage() {
  const { profile, email } = await requireSession();

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold">Profile</h1>
      <p className="mt-1 text-muted">Signed in as {email}</p>

      {profile.role === "customer" && (
        <div className="card mt-6 border-sky-300 bg-sky-50 p-5">
          <h2 className="font-semibold">Run treks yourself?</h2>
          <p className="mb-4 mt-1 text-sm text-muted">
            Become an organizer to publish trek batches, build your own registration form and manage sign-ups.
          </p>
          <BecomeOrganizer action={becomeOrganizer} />
        </div>
      )}

      <ActionForm action={updateProfile} className="card mt-6 space-y-4 p-5">
        <div>
          <label htmlFor="full_name" className="label">Full name</label>
          <input id="full_name" name="full_name" className="input" defaultValue={profile.full_name ?? ""} />
        </div>
        <div>
          <label htmlFor="organization_name" className="label">Organization name</label>
          <input id="organization_name" name="organization_name" className="input" defaultValue={profile.organization_name ?? ""} />
        </div>
        <div>
          <label htmlFor="bio" className="label">Bio</label>
          <textarea id="bio" name="bio" rows={4} className="input" defaultValue={profile.bio ?? ""} />
        </div>
        <div>
          <label htmlFor="website" className="label">Website</label>
          <input id="website" name="website" type="url" placeholder="https://" className="input" defaultValue={profile.website ?? ""} />
        </div>
        <div>
          <label htmlFor="avatar_url" className="label">Avatar URL</label>
          <input id="avatar_url" name="avatar_url" type="url" placeholder="https://" className="input" defaultValue={profile.avatar_url ?? ""} />
        </div>
        <SubmitButton pendingLabel="Saving…">Save profile</SubmitButton>
      </ActionForm>
    </div>
  );
}

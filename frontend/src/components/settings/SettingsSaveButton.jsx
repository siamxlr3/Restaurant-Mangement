import { Loader2, Save } from 'lucide-react'

/**
 * SettingsSaveButton — submit button with integrated spinner.
 *
 * Props:
 *   isLoading   - boolean (React Hook Form isSubmitting)
 *   label       - button label (default: "Save changes")
 *   disabled    - optional extra disabled flag
 */
export default function SettingsSaveButton({
  isLoading = false,
  label = 'Save changes',
  disabled = false,
}) {
  return (
    <button
      type="submit"
      disabled={isLoading || disabled}
      className="btn-primary flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {isLoading ? (
        <Loader2 size={15} className="animate-spin" />
      ) : (
        <Save size={15} />
      )}
      {isLoading ? 'Saving…' : label}
    </button>
  )
}

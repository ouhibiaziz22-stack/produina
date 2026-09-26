import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";

const schema = z.object({
  studentName: z.string().trim().min(2, "Enter the student's name."),
  lycee: z.string().trim().min(2, "Enter the lycée."),
  section: z.enum(["Math", "Sciences", "Technique", "Info", "Éco-Gestion", "Lettres", "Sport"]),
});

export type BacCustomization = z.infer<typeof schema>;

export function BacCustomizer({
  onSubmit,
  onClose,
}: {
  onSubmit: (customization: BacCustomization) => void;
  onClose: () => void;
}) {
  const [values, setValues] = useState({
    studentName: "",
    lycee: "",
    section: "Math" as BacCustomization["section"],
  });
  const [error, setError] = useState("");
  return (
    <div className="drawer-layer" role="dialog" aria-modal="true" aria-label="BAC customization">
      <div className="drawer-backdrop" onClick={onClose} />
      <form
        className="bac-customizer-panel"
        onSubmit={(event) => {
          event.preventDefault();
          const result = schema.safeParse(values);
          if (!result.success) {
            setError(result.error.issues[0]?.message || "Check the required fields.");
            return;
          }
          onSubmit(result.data);
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="bac-customizer-close"
          onClick={onClose}
          aria-label="Close customization"
        >
          ×
        </button>
        <span className="section-kicker">BAC 2K27 / MAKE IT YOURS</span>
        <h2>Personalize your class piece.</h2>
        <label>
          Student name
          <input
            required
            value={values.studentName}
            onChange={(event) => setValues({ ...values, studentName: event.target.value })}
          />
        </label>
        <label>
          Lycée
          <input
            required
            value={values.lycee}
            onChange={(event) => setValues({ ...values, lycee: event.target.value })}
          />
        </label>
        <label>
          Section
          <select
            value={values.section}
            onChange={(event) =>
              setValues({ ...values, section: event.target.value as BacCustomization["section"] })
            }
          >
            {["Math", "Sciences", "Technique", "Info", "Éco-Gestion", "Lettres", "Sport"].map(
              (section) => (
                <option key={section}>{section}</option>
              ),
            )}
          </select>
        </label>
        {error && (
          <p className="size-warning" role="alert">
            {error}
          </p>
        )}
        <Button type="submit" className="button-light">
          ADD PERSONALIZED PIECE
        </Button>
      </form>
    </div>
  );
}

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, Loader2, Upload, UserPlus, X } from "lucide-react";
import { motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useCreateWorker } from "../hooks/useQueries";

export default function AddWorkerPage() {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [joiningDate, setJoiningDate] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createWorker = useCreateWorker();

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Photo must be under 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setPhotoPreview(result);
      setPhotoBase64(result);
    };
    reader.readAsDataURL(file);
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Worker name is required.";
    if (!role.trim()) errs.role = "Role is required.";
    if (!joiningDate) errs.joiningDate = "Joining date is required.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await createWorker.mutateAsync({
        name: name.trim(),
        role: role.trim(),
        joiningDate,
        photo: photoBase64,
      });
      setSuccess(true);
      toast.success(`${name} has been added successfully!`);
      setName("");
      setRole("");
      setJoiningDate("");
      setPhotoPreview(null);
      setPhotoBase64(null);
      setErrors({});
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      toast.error("Failed to add worker. Please try again.");
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-lg mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold text-foreground">Add New Worker</h1>
        <p className="text-sm text-muted-foreground">
          Fill in the details to register a new worker.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card className="shadow-card border-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-primary" />
              Worker Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Photo upload */}
              <div className="flex flex-col items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ")
                      fileInputRef.current?.click();
                  }}
                  data-ocid="add_worker.upload_button"
                  className="w-24 h-24 rounded-full border-2 border-dashed border-border bg-muted/50 flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all overflow-hidden"
                >
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <>
                      <Upload className="w-5 h-5 text-muted-foreground mb-1" />
                      <span className="text-[10px] text-muted-foreground text-center px-2">
                        Upload Photo
                      </span>
                    </>
                  )}
                </button>
                {photoPreview && (
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoPreview(null);
                      setPhotoBase64(null);
                    }}
                    className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1"
                  >
                    <X className="w-3 h-3" /> Remove photo
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                  data-ocid="add_worker.dropzone"
                />
                <p className="text-[11px] text-muted-foreground">
                  PNG, JPG up to 2MB
                </p>
              </div>

              {/* Name */}
              <div className="space-y-1.5">
                <Label htmlFor="worker-name">
                  Worker Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="worker-name"
                  placeholder="e.g. Rajesh Kumar"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setErrors((prev) => ({ ...prev, name: "" }));
                  }}
                  data-ocid="add_worker.input"
                />
                {errors.name && (
                  <p
                    className="text-xs text-destructive"
                    data-ocid="add_worker.error_state"
                  >
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Role */}
              <div className="space-y-1.5">
                <Label htmlFor="worker-role">
                  Role / Position <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="worker-role"
                  placeholder="e.g. Construction Worker"
                  value={role}
                  onChange={(e) => {
                    setRole(e.target.value);
                    setErrors((prev) => ({ ...prev, role: "" }));
                  }}
                  data-ocid="add_worker.input"
                />
                {errors.role && (
                  <p
                    className="text-xs text-destructive"
                    data-ocid="add_worker.error_state"
                  >
                    {errors.role}
                  </p>
                )}
              </div>

              {/* Joining Date */}
              <div className="space-y-1.5">
                <Label htmlFor="joining-date">
                  Joining Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="joining-date"
                  type="date"
                  value={joiningDate}
                  onChange={(e) => {
                    setJoiningDate(e.target.value);
                    setErrors((prev) => ({ ...prev, joiningDate: "" }));
                  }}
                  data-ocid="add_worker.input"
                />
                {errors.joiningDate && (
                  <p
                    className="text-xs text-destructive"
                    data-ocid="add_worker.error_state"
                  >
                    {errors.joiningDate}
                  </p>
                )}
              </div>

              {/* Success state */}
              {success && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2 p-3 rounded-lg bg-status-present/10 border border-status-present/20"
                  data-ocid="add_worker.success_state"
                >
                  <CheckCircle className="w-4 h-4 text-status-present" />
                  <p className="text-sm text-status-present font-medium">
                    Worker added successfully!
                  </p>
                </motion.div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={createWorker.isPending}
                data-ocid="add_worker.submit_button"
              >
                {createWorker.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding
                    Worker...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" /> Add Worker
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

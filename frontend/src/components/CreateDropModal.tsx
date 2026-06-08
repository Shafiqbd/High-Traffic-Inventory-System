import { useState } from "react";
import { Modal, ModalActions } from "./ui/Modal";
import { Input } from "./ui/Input";
import { Select } from "./ui/Select";
import { CreateDropDto } from "../types/drop.types";
import { useCreateDropMutation } from "../services/drop/dropApi";

const statusOptions = [
  { value: "ACTIVE", label: "Active" },
  { value: "UPCOMING", label: "Upcoming" },
  { value: "ENDED", label: "Ended" },
];

interface CreateDropModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateDropModal({ isOpen, onClose }: CreateDropModalProps) {
  const [createDrop, { isLoading }] = useCreateDropMutation();

  const [formData, setFormData] = useState<CreateDropDto>({
    name: "",
    price: "",
    initialStock: 0,
    startsAt: "",
    status: "ACTIVE",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.price || parseFloat(formData.price as string) <= 0) {
      newErrors.price = "Price must be a positive number";
    }

    if (!formData.initialStock || formData.initialStock <= 0) {
      newErrors.initialStock = "Initial stock must be a positive number";
    }

    if (!formData.startsAt) {
      newErrors.startsAt = "Start date is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      await createDrop({
        name: formData.name,
        price: formData.price,
        initialStock: formData.initialStock,
        startsAt: formData.startsAt,
        status: formData.status,
      }).unwrap();

      // Reset form and close modal
      setFormData({
        name: "",
        price: "",
        initialStock: 0,
        startsAt: "",
        status: "ACTIVE",
      });
      setErrors({});
      onClose();
    } catch (error: any) {
      setErrors({ form: error.message || "Failed to create drop" });
    }
  };

  const handleChange = (field: keyof CreateDropDto, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleClose = () => {
    setFormData({
      name: "",
      price: "",
      initialStock: 0,
      startsAt: "",
      status: "UPCOMING",
    });
    setErrors({});
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Drop"
      size="md"
      footer={
        <ModalActions
          onCancel={handleClose}
          onConfirm={handleSubmit}
          isConfirmLoading={isLoading}
        />
      }
    >
      <form onSubmit={(e) => e.preventDefault()}>
        {errors.form && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
            {errors.form}
          </div>
        )}

        <Input
          label="Drop Name"
          value={formData.name}
          onChange={(e) => handleChange("name", e.target.value)}
          error={errors.name}
          placeholder="e.g., Air Jordan 1 Retro High"
          required
        />

        <Input
          label="Price (USD)"
          type="number"
          step="0.01"
          min="0"
          value={formData.price}
          onChange={(e) => handleChange("price", e.target.value)}
          error={errors.price}
          placeholder="e.g., 180.00"
          required
        />

        <Input
          label="Initial Stock"
          type="number"
          min="0"
          value={formData.initialStock || ""}
          onChange={(e) =>
            handleChange("initialStock", parseInt(e.target.value) || 0)
          }
          error={errors.initialStock}
          placeholder="e.g., 100"
          required
        />

        <Input
          label="Start Date & Time"
          type="datetime-local"
          value={formData.startsAt}
          onChange={(e) => handleChange("startsAt", e.target.value)}
          error={errors.startsAt}
          required
        />

        <Select
          label="Status"
          options={statusOptions}
          value={formData.status}
          onChange={(e) => handleChange("status", e.target.value)}
          helperText="Status will be automatically determined if not selected"
        />
      </form>
    </Modal>
  );
}

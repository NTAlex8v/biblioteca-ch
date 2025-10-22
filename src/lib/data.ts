import { LucideIcon, Microscope, FlaskConical, Users, BrainCircuit } from 'lucide-react';

// This is a placeholder type. You should replace it with the actual Category type from your types file.
export type Category = {
  id: string;
  name: string;
  icon: LucideIcon;
};

export const mockCategories: Category[] = [
  { id: 'medicina', name: 'Medicina', icon: Microscope },
  { id: 'ciencias', name: 'Ciencias de la Vida', icon: FlaskConical },
  { id: 'humanidades', name: 'Salud Pública', icon: Users },
  { id: 'psicologia', name: 'Psicología', icon: BrainCircuit },
];

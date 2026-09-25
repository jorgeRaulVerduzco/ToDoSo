import { useState } from "react";
import { PRESETS, PresetKey } from "../data/presets";
import { useAddPreset } from "../hooks/useAddPreset";
import { Button } from "@/components/ui/button";

export function PresetButtons() {
  const { mutateAsync: addPreset, isPending } = useAddPreset();
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleAddPreset = async (key: PresetKey) => {
    setFeedback(null);
    try {
      const result = await addPreset(key);
      
      if (result.added > 0) {
        setFeedback(`Se agregaron ${result.added} sitios.`);
      } else if (result.alreadyExisted > 0) {
        setFeedback("Esos sitios ya estaban en tu lista.");
      }
      
      // Clear feedback after 3 seconds
      setTimeout(() => setFeedback(null), 3000);
    } catch (e) {
      setFeedback("Ocurrió un error al agregar los sitios.");
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  return (
    <div className="mb-8">
      <h3 className="text-sm font-medium text-muted-foreground mb-3">Agregar grupos rápidos</h3>
      <div className="flex flex-wrap gap-2">
        {(Object.entries(PRESETS) as [PresetKey, typeof PRESETS[PresetKey]][]).map(([key, preset]) => (
          <Button 
            key={key} 
            variant="outline" 
            size="sm"
            onClick={() => handleAddPreset(key)}
            disabled={isPending}
          >
            {preset.label}
          </Button>
        ))}
      </div>
      {feedback && (
        <p className="text-sm text-primary mt-2 animate-in fade-in">{feedback}</p>
      )}
    </div>
  );
}

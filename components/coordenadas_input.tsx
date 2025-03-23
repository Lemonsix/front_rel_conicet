import {
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { ControllerRenderProps } from "react-hook-form";

type Direccion = "N" | "S" | "E" | "W";

interface Coordenada<T extends Direccion> {
  grados: number;
  minutos: number;
  segundos: number;
  direccion: T;
}

interface FormValues {
  latitud: Coordenada<"N" | "S">;
  longitud: Coordenada<"E" | "W">;
  profundidad: number;
  conteo: number;
  sustratoId: string;
}

interface CoordenadaInputProps<T extends Direccion> {
  label: string;
  field: ControllerRenderProps<FormValues, "latitud" | "longitud">;
  direccionOptions: T[];
}

export const CoordenadaInput = <T extends Direccion>({
  label,
  field,
  direccionOptions,
}: CoordenadaInputProps<T>) => (
  <FormItem>
    <FormLabel>{label}</FormLabel>
    <div className="flex gap-1 items-end">
      <div className="flex items-center">
        <FormControl>
          <Input
            type="number"
            placeholder="Grados"
            value={field.value.grados}
            onChange={(e) =>
              field.onChange({
                ...field.value,
                grados: parseInt(e.target.value, 10),
              })
            }
            min={0}
            max={label === "Latitud" ? 90 : 180}
            className="w-[80px]"
          />
        </FormControl>
        <span className="mx-1">°</span>
      </div>
      <div className="flex items-center">
        <FormControl>
          <Input
            type="number"
            placeholder="Minutos"
            value={field.value.minutos}
            onChange={(e) =>
              field.onChange({
                ...field.value,
                minutos: parseInt(e.target.value, 10),
              })
            }
            min={0}
            max={59}
            className="w-[80px]"
          />
        </FormControl>
        <span className="mx-1">&apos;</span>
      </div>
      <div className="flex items-center">
        <FormControl>
          <Input
            type="number"
            step="0.01"
            placeholder="Segundos"
            value={field.value.segundos}
            onChange={(e) =>
              field.onChange({
                ...field.value,
                segundos: parseFloat(e.target.value),
              })
            }
            min={0}
            max={59.99}
            className="w-[80px]"
          />
        </FormControl>
        <span className="mx-1">&quot;</span>
      </div>
      <Select
        onValueChange={(value) =>
          field.onChange({
            ...field.value,
            direccion: value as Coordenada<T>["direccion"],
          })
        }
        defaultValue={field.value.direccion}
      >
        <FormControl>
          <SelectTrigger className="w-[80px]">
            <SelectValue placeholder="Dir" />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          {direccionOptions.map((dir) => (
            <SelectItem key={dir} value={dir}>
              {dir}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
    <FormMessage />
  </FormItem>
);

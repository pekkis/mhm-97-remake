import type { FC } from "react";
import { useForm } from "react-hook-form";
import Button from "@/components/form/Button";
import Input from "@/components/form/Input";
import Select from "@/components/form/Select";
import Label from "@/components/form/Label";
import LabelDiv from "@/components/form/LabelDiv";
import Field from "@/components/form/Field";
import difficultyLevels from "@/data/difficulty-levels";
import type { Team } from "@/state/game";
import type { Competition } from "@/types/competitions";
import { values } from "remeda";

export type ManagerFormValues = {
  name: string;
  arena: string;
  difficulty: string;
  team: number;
};

const defaultValues: ManagerFormValues = {
  name: "Gaylord Lohiposki",
  arena: "MasoSports Areena",
  difficulty: "2",
  team: 12
};

type ManagerFormProps = {
  advance: (values: ManagerFormValues) => void;
  competitions: Record<string, Competition>;
  teams: Team[];
};

const ManagerForm: FC<ManagerFormProps> = ({
  advance,
  competitions,
  teams
}) => {
  const { register, handleSubmit } = useForm<ManagerFormValues>({
    defaultValues
  });

  return (
    <div>
      <form onSubmit={handleSubmit(advance)}>
        <Field>
          <Label>Managerin nimi</Label>
          <Input block id="name" {...register("name")} />
        </Field>

        <Field>
          <Label>Areenan nimi</Label>
          <Input block id="arena" {...register("arena")} />
        </Field>

        <Field>
          <LabelDiv>Vaikeustaso</LabelDiv>
          {difficultyLevels.map((dl) => {
            return (
              <div key={dl.value}>
                <label>
                  <Input
                    type="radio"
                    value={dl.value}
                    {...register("difficulty")}
                  />{" "}
                  {dl.name} ({dl.description})
                </label>
              </div>
            );
          })}
        </Field>

        <Field>
          <LabelDiv>Joukkue</LabelDiv>

          <Select {...register("team")}>
            {values(competitions).map((c) => {
              return (
                <optgroup key={c.id} label={c.name}>
                  {c.teams
                    .map((t) => teams[t])
                    .toSorted((a, b) => a.name.localeCompare(b.name))
                    .map((t) => {
                      return (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      );
                    })}
                </optgroup>
              );
            })}
          </Select>
        </Field>

        <Field>
          <Button block type="submit">
            Eteenpäin
          </Button>
        </Field>
      </form>
    </div>
  );
};

export default ManagerForm;

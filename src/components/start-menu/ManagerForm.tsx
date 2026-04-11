import type { FC } from "react";
import { useForm } from "react-hook-form";
import Button from "../form/Button";
import Input from "../form/Input";
import Select from "../form/Select";
import Label from "../form/Label";
import LabelDiv from "../form/LabelDiv";
import Field from "../form/Field";
import difficultyLevels from "../../data/difficulty-levels";
import type { Team } from "../../ducks/game";
import type { MetaManager } from "../../ducks/meta";
import type { Competition } from "../../types/competitions";

type ManagerFormProps = {
  manager: MetaManager;
  advance: (values: MetaManager) => void;
  competitions: Record<string, Competition>;
  teams: Team[];
};

const ManagerForm: FC<ManagerFormProps> = ({
  manager,
  advance,
  competitions,
  teams,
}) => {
  const { register, handleSubmit } = useForm<MetaManager>({
    defaultValues: manager,
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
            {Object.values(competitions).map((c) => {
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

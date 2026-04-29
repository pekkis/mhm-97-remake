import type { FC } from "react";
import { useForm, Controller } from "react-hook-form";
import Slider from "@/components/ui/form/Slider";
import { amount as a } from "@/services/format";
import odds from "@/data/championship-betting";
import Button from "@/components/ui/Button";
import type { Team } from "@/state/game";
import type { Manager } from "@/state/manager";
import type { Competition } from "@/types/competitions";

type ChampionshipBettingFormValues = {
  team: string;
  amount: number;
};

type ChampionshipBettingFormProps = {
  manager: Manager;
  competition: Competition;
  teams: Team[];
  betChampion: (
    managerId: string,
    teamId: number,
    amount: number,
    odds: number
  ) => void;
};

const BettingForm: FC<ChampionshipBettingFormProps> = ({
  manager,
  competition,
  teams,
  betChampion
}) => {
  const teamsAndOdds = odds(competition, teams);

  const { register, handleSubmit, control, watch } =
    useForm<ChampionshipBettingFormValues>({
      defaultValues: {
        team: "",
        amount: 10000
      }
    });

  const values = watch();

  const onSubmit = (data: ChampionshipBettingFormValues) => {
    const teamId = parseInt(data.team, 10);
    betChampion(
      manager.id,
      teamId,
      data.amount,
      teamsAndOdds.find((t) => t.id === teamId)!.odds
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <h3>Valitse ehdokkaasi</h3>

      {teamsAndOdds.map((team) => {
        return (
          <div key={team.id}>
            <label>
              <input
                type="radio"
                value={team.id.toString()}
                {...register("team", { required: true })}
              />
              {team.name} ({team.odds})
            </label>
          </div>
        );
      })}

      <h3>Valitse panos</h3>

      <div>
        <Controller
          name="amount"
          control={control}
          render={({ field }) => (
            <Slider
              min={10000}
              max={1000000}
              step={10000}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
        <strong>{a(values.amount)}</strong> pekkaa
      </div>

      <Button disabled={values.team === ""} block type="submit">
        Veikkaa mestaria
      </Button>
    </form>
  );
};

export default BettingForm;

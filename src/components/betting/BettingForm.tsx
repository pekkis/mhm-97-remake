import type { FC } from "react";
import { useForm, Controller } from "react-hook-form";
import Slider from "@/components/form/Slider";
import { amount as a } from "@/services/format";
import Button from "@/components/form/Button";
import TeamName from "@/components/team/Name";
import type { Team } from "@/ducks/game";
import type { Manager } from "@/ducks/manager";
import type { Competition } from "@/types/competitions";

type BettingFormValues = {
  "0": string;
  "1": string;
  "2": string;
  "3": string;
  "4": string;
  "5": string;
  amount: number;
};

type BettingFormProps = {
  manager: Manager;
  competition: Competition;
  teams: Team[];
  bet: (coupon: string[], amount: number) => void;
  turn?: unknown;
};

const BettingForm: FC<BettingFormProps> = ({ competition, teams, bet }) => {
  const group = competition.phases[0].groups[0];
  const round = group.round;
  const pairings = group.schedule[round];

  const { register, handleSubmit, control, watch } = useForm<BettingFormValues>(
    {
      defaultValues: {
        "0": "",
        "1": "",
        "2": "",
        "3": "",
        "4": "",
        "5": "",
        amount: 10000
      }
    }
  );

  const values = watch();

  const onSubmit = (data: BettingFormValues) => {
    const coupon = [
      data["0"],
      data["1"],
      data["2"],
      data["3"],
      data["4"],
      data["5"]
    ];
    bet(coupon, data.amount);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {pairings.map((pairing, i) => {
        const name = i.toString() as keyof BettingFormValues;
        return (
          <div key={i}>
            <div>
              <TeamName team={teams[group.teams[pairing.home]]} /> -{" "}
              <TeamName team={teams[group.teams[pairing.away]]} />
            </div>
            <div>
              <label>
                <input
                  type="radio"
                  value="1"
                  {...register(name, { required: true })}
                />{" "}
                1
              </label>
              <label>
                <input
                  type="radio"
                  value="x"
                  {...register(name, { required: true })}
                />{" "}
                x
              </label>
              <label>
                <input
                  type="radio"
                  value="2"
                  {...register(name, { required: true })}
                />{" "}
                2
              </label>
            </div>
          </div>
        );
      })}

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

      <Button
        disabled={Object.entries(values).some(
          ([k, v]) => k !== "amount" && v === ""
        )}
        block
        type="submit"
      >
        Veikkaa
      </Button>
    </form>
  );
};

export default BettingForm;

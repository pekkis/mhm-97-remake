import type { FC } from "react";
import { Formik } from "formik";
import Slider from "../form/Slider";
import { amount as a } from "../../services/format";
import odds from "../../data/championship-betting";
import Button from "../form/Button";
import type { Team } from "../../ducks/game";
import type { Manager } from "../../ducks/manager";
import type { Competition } from "../../types/competitions";

type ChampionshipBettingFormProps = {
  manager: Manager;
  competition: Competition;
  teams: Team[];
  betChampion: (
    managerId: string,
    teamId: number,
    amount: number,
    odds: number,
  ) => void;
};

const BettingForm: FC<ChampionshipBettingFormProps> = ({
  manager,
  competition,
  teams,
  betChampion,
}) => {
  const teamsAndOdds = odds(competition, teams);

  return (
    <Formik
      initialValues={{
        team: "",
        amount: 10000,
      }}
      onSubmit={(values) => {
        betChampion(
          manager.id,
          parseInt(values.team, 10),
          parseInt(String(values.amount), 10),
          teamsAndOdds.find((t) => t.id === parseInt(values.team, 10))!.odds,
        );
      }}
    >
      {({ values, setFieldValue, handleChange, handleSubmit }) => {
        return (
          <form onSubmit={handleSubmit}>
            <h3>Valitse ehdokkaasi</h3>

            {teamsAndOdds.map((team) => {
              return (
                <div key={team.id}>
                  <label>
                    <input
                      name="team"
                      type="radio"
                      value={team.id.toString()}
                      checked={values.team === team.id.toString()}
                      onChange={handleChange}
                    />
                    {team.name} ({team.odds})
                  </label>
                </div>
              );
            })}

            <h3>Valitse panos</h3>

            <div>
              <Slider
                min={10000}
                max={1000000}
                step={10000}
                value={values.amount}
                onChange={(value) => {
                  void setFieldValue("amount", value);
                }}
              />
              <strong>{a(values.amount)}</strong> pekkaa
            </div>

            <Button disabled={values.team === ""} block type="submit">
              Veikkaa mestaria
            </Button>
          </form>
        );
      }}
    </Formik>
  );
};

export default BettingForm;

import type { FC } from "react";
import { Formik } from "formik";
import Slider from "rc-slider";
import { amount as a } from "../../services/format";
import Button from "../form/Button";
import TeamName from "../team/Name";
import type { Team } from "../../ducks/game";
import type { Manager } from "../../ducks/manager";
import type { Competition } from "../../types/competitions";

type BettingFormProps = {
  manager: Manager;
  competition: Competition;
  teams: Team[];
  bet: (coupon: string[], amount: number) => void;
  turn?: unknown;
};

const BettingForm: FC<BettingFormProps> = ({
  manager,
  competition,
  teams,
  bet,
}) => {
  const group = competition.phases[0].groups[0];
  const round = group.round;

  const pairings = group.schedule[round];

  return (
    <Formik
      initialValues={{
        0: "",
        1: "",
        2: "",
        3: "",
        4: "",
        5: "",
        amount: 10000,
      }}
      onSubmit={(values) => {
        const coupon = [
          values["0"],
          values["1"],
          values["2"],
          values["3"],
          values["4"],
          values["5"],
        ];
        bet(coupon, parseInt(String(values.amount), 10));
      }}
    >
      {({ values, setFieldValue, handleChange, handleSubmit }) => {
        return (
          <form onSubmit={handleSubmit}>
            {pairings.map((pairing, i) => {
              return (
                <div key={i}>
                  <div>
                    <TeamName team={teams[group.teams[pairing.home]]} /> -{" "}
                    <TeamName team={teams[group.teams[pairing.away]]} />
                  </div>
                  <div>
                    <label>
                      <input
                        name={i.toString()}
                        type="radio"
                        value="1"
                        checked={
                          values[i.toString() as keyof typeof values] === "1"
                        }
                        onChange={handleChange}
                      />{" "}
                      1
                    </label>
                    <label>
                      <input
                        name={i.toString()}
                        type="radio"
                        value="x"
                        checked={
                          values[i.toString() as keyof typeof values] === "x"
                        }
                        onChange={handleChange}
                      />{" "}
                      x
                      <label>
                        <input
                          name={i.toString()}
                          type="radio"
                          value="2"
                          checked={
                            values[i.toString() as keyof typeof values] === "2"
                          }
                          onChange={handleChange}
                        />{" "}
                        2
                      </label>
                    </label>
                  </div>
                </div>
              );
            })}

            <div>
              <Slider
                min={10000}
                max={1000000}
                step={10000}
                value={values.amount}
                onChange={(value) => {
                  setFieldValue("amount", value);
                }}
              />
              <strong>{a(values.amount)}</strong> pekkaa
            </div>

            <Button
              disabled={Object.values(values).some((value) => value === "")}
              block
              type="submit"
            >
              Veikkaa
            </Button>
          </form>
        );
      }}
    </Formik>
  );
};

export default BettingForm;

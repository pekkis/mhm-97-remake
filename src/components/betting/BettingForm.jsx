import React from "react";
import { Formik } from "formik";
import Slider from "rc-slider";
import { amount as a } from "../../services/format";
import Button from "../form/Button";
import TeamName from "../team/Name";
import { Seq, List } from "immutable";

const BettingForm = props => {
  const { manager, competition, teams, bet } = props;

  const group = competition.getIn(["phases", 0, "groups", 0]);
  const round = group.get("round");

  const pairings = group.getIn(["schedule", round]);

  return (
    <Formik
      initialValues={{
        "0": "",
        "1": "",
        "2": "",
        "3": "",
        "4": "",
        "5": "",
        amount: 10000
      }}
      onSubmit={values => {
        console.log(values);

        const coupon = List.of(
          values["0"],
          values["1"],
          values["2"],
          values["3"],
          values["4"],
          values["5"]
        );
        bet(manager.get("id"), coupon, parseInt(values.amount, 10));
      }}
    >
      {({ values, setFieldValue, handleChange, handleSubmit }) => {
        return (
          <form onSubmit={handleSubmit}>
            {pairings.map((pairing, i) => {
              return (
                <div key={i}>
                  <div>
                    <TeamName
                      team={teams.get(
                        group.getIn(["teams", pairing.get("home")])
                      )}
                    />{" "}
                    -{" "}
                    <TeamName
                      team={teams.get(
                        group.getIn(["teams", pairing.get("away")])
                      )}
                    />
                  </div>
                  <div>
                    <label>
                      <input
                        name={i.toString()}
                        type="radio"
                        value="1"
                        checked={values[i.toString()] === "1"}
                        onChange={handleChange}
                      />{" "}
                      1
                    </label>
                    <label>
                      <input
                        name={i.toString()}
                        type="radio"
                        value="x"
                        checked={values[i.toString()] === "x"}
                        onChange={handleChange}
                      />{" "}
                      x
                      <label>
                        <input
                          name={i.toString()}
                          type="radio"
                          value="2"
                          checked={values[i.toString()] === "2"}
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
                onChange={value => {
                  setFieldValue("amount", value);
                }}
              />
              <strong>{a(values.amount)}</strong> pekkaa
            </div>

            <Button
              disabled={Seq(values).some(value => value === "")}
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

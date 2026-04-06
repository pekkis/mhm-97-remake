import React from "react";
import { Formik } from "formik";
import Button from "../form/Button";
import Input from "../form/Input";
import Select from "../form/Select";
import Label from "../form/Label";
import LabelDiv from "../form/LabelDiv";
import Field from "../form/Field";
import difficultyLevels from "../../data/difficulty-levels";

const ManagerForm = (props) => {
  const { manager, advance, competitions, teams } = props;

  return (
    <div>
      <Formik
        initialValues={manager.toJS()}
        onSubmit={(values) => {
          advance(values);
        }}
      >
        {({ handleSubmit, handleChange, values }) => {
          return (
            <form onSubmit={handleSubmit}>
              <Field>
                <Label>Managerin nimi</Label>
                <Input
                  block
                  id="name"
                  value={values.name}
                  onChange={handleChange}
                />
              </Field>

              <Field>
                <Label>Areenan nimi</Label>
                <Input
                  block
                  id="arena"
                  value={values.arena}
                  onChange={handleChange}
                />
              </Field>

              <Field>
                <LabelDiv>Vaikeustaso</LabelDiv>
                {difficultyLevels.map((dl) => {
                    return (
                      <div key={dl.value}>
                        <label>
                          <Input
                            type="radio"
                            name="difficulty"
                            value={dl.value}
                            checked={values.difficulty === dl.value}
                            onChange={handleChange}
                          />{" "}
                          {dl.name} ({dl.description})
                        </label>
                      </div>
                    );
                  })}
              </Field>

              <Field>
                <LabelDiv>Joukkue</LabelDiv>

                <Select name="team" value={values.team} onChange={handleChange}>
                  {competitions
                    .map((c) => {
                      return (
                        <optgroup key={c.get("id")} label={c.get("name")}>
                          {c
                            .get("teams")
                            .map((t) => teams[t])
                            .sortBy((t) => t.name)
                            .map((t) => {
                              return (
                                <option key={t.id} value={t.id}>
                                  {t.name}
                                </option>
                              );
                            })}
                        </optgroup>
                      );
                    })
                    .toList()}
                </Select>
              </Field>

              <Field>
                <Button block type="submit">
                  Eteenpäin
                </Button>
              </Field>
            </form>
          );
        }}
      </Formik>
    </div>
  );
};

export default ManagerForm;

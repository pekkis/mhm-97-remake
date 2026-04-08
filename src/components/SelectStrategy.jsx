import React from "react";
import strategies from "../data/strategies";
import Button from "./form/Button";
import Box from "./styled-system/Box";

const SelectStrategy = (props) => {
  const { manager, selectStrategy } = props;

  return (
    <Box p={1}>
      <h2>Valitse harjoittelustrategia</h2>

      <p>
        On kesä, ja aika määrätä mihin joukkue ajoittaa huippukuntonsa! Tarjolla
        on kolme vaihtoehtoa:
      </p>

      {strategies.map((strategy) => {
        return (
          <div key={strategy.id}>
            <h3>{strategy.name}</h3>

            <p>{strategy.description}</p>

            <p>
              <Button
                block
                onClick={() => {
                  selectStrategy(manager.id, strategy.id);
                }}
              >
                Valitse strategia "{strategy.name}"
              </Button>
            </p>
          </div>
        );
      })}
    </Box>
  );
};

export default SelectStrategy;

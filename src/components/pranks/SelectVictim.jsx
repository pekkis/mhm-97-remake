import React from "react";
import Button from "../form/Button";
import ButtonContainer from "../ui/ButtonContainer";

const SelectVictim = (props) => {
  const { competition, manager, selectVictim, teams, cancel } = props;

  return (
    <div>
      <h3>Valitse uhrisi</h3>
      <ButtonContainer>
        <Button secondary block onClick={cancel}>
          Peruuta jäynä
        </Button>

        {competition.teams
          .filter((teamId) => teamId !== manager.team)
          .map((teamId) => {
            return (
              <Button key={teamId} block onClick={() => selectVictim(teamId)}>
                {teams[teamId].name}
              </Button>
            );
          })}
      </ButtonContainer>
    </div>
  );
};

export default SelectVictim;

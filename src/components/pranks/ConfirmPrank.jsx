import React from "react";
import ButtonContainer from "../ui/ButtonContainer";
import Button from "../form/Button";
import pranks from "../../data/pranks";

const ConfirmPrank = (props) => {
  const { cancel, manager, teams, prank, execute } = props;

  const prankInfo = pranks[prank.type];

  console.log(prankInfo, "pinfo");

  return (
    <div>
      <p>
        <strong>Jäynä: </strong>
        {prankInfo.name}
      </p>

      <p>
        <strong>Uhri: </strong>
        {teams[prank.victim]?.name}
      </p>

      <ButtonContainer>
        <Button
          block
          onClick={() => {
            execute(manager.id, prank.type, prank.victim);
          }}
        >
          Varmista
        </Button>

        <Button
          block
          secondary
          onClick={() => {
            cancel();
          }}
        >
          Peruuta
        </Button>
      </ButtonContainer>
    </div>
  );
};

export default ConfirmPrank;

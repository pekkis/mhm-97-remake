import strategies from "@/data/strategies";
import Button from "./form/Button";
import Box from "./styled-system/Box";
import { AppMachineContext } from "@/context/app-machine-context";
import { activeManager } from "@/machines/selectors";

const SelectStrategy = () => {
  const manager = AppMachineContext.useSelector((state) =>
    activeManager(state.context)
  );
  const actor = AppMachineContext.useActorRef();

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
                onClick={() =>
                  actor.send({
                    type: "SELECT_STRATEGY",
                    payload: {
                      manager: manager.id,
                      strategy: strategy.id
                    }
                  })
                }
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

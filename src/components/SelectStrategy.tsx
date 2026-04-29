import strategies from "@/data/strategies";
import Button from "./ui/Button";
import { activeManager } from "@/machines/selectors";
import { GameMachineContext } from "@/context/game-machine-context";
import AdvancedHeaderedPage from "@/components/ui/AdvancedHeaderedPage";
import ManagerInfo from "@/components/ManagerInfo";

const SelectStrategy = () => {
  const manager = GameMachineContext.useSelector((state) =>
    activeManager(state.context)
  );
  const actor = GameMachineContext.useActorRef();

  return (
    <AdvancedHeaderedPage managerInfo={<ManagerInfo details />}>
      <h2>Valitse harjoittelustrategia</h2>

        <p>
          On kesä, ja aika määrätä mihin joukkue ajoittaa huippukuntonsa!
          Tarjolla on kolme vaihtoehtoa:
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
    </AdvancedHeaderedPage>
  );
};

export default SelectStrategy;

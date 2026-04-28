import StickyMenu from "./StickyMenu";
import HeaderedPage from "./ui/HeaderedPage";
import ManagerInfo from "./ManagerInfo";
import * as styles from "./Services.css";
import Toggle from "./form/Toggle";
import Markdown from "react-markdown";
import Box from "./ui/Box";
import {
  GameMachineContext,
  useGameContext
} from "@/context/game-machine-context";
import { entries } from "remeda";

import services from "@/data/services";
import { activeManager } from "@/machines/selectors";

const Services = () => {
  const manager = useGameContext(activeManager);
  const basePrices = useGameContext((ctx) => ctx.serviceBasePrices);
  const gameActor = GameMachineContext.useActorRef();

  console.log("MANAGER SERVICES", manager.services);

  return (
    <HeaderedPage>
      <StickyMenu back />
      <ManagerInfo details />

      <Box p="md">
        <h2>Erikoistoimenpiteet</h2>

        <div className={styles.servicesList}>
          {entries(services).map(([key, service]) => {
            const basePrice = basePrices[key];
            return (
              <div key={key}>
                <div>
                  <Toggle
                    id={key}
                    checked={manager.services[key]}
                    onChange={() => {
                      gameActor.send({
                        type: "TOGGLE_SERVICE",
                        payload: { manager: manager.id, service: key }
                      });
                    }}
                  />
                  <label htmlFor={key}>
                    <strong>{service.name}</strong>
                  </label>
                </div>

                <Markdown>
                  {service.description(service.price(basePrice, manager))}
                </Markdown>
              </div>
            );
          })}
        </div>
      </Box>
    </HeaderedPage>
  );
};

export default Services;

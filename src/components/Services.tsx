import Header from "./Header";
import HeaderedPage from "./ui/HeaderedPage";
import ManagerInfo from "./ManagerInfo";
import * as styles from "./Services.css";
import Toggle from "./form/Toggle";
import Markdown from "react-markdown";
import Box from "./styled-system/Box";
import { useAppSelector, useAppDispatch } from "@/config/redux";
import { managerToggleService } from "../ducks/manager";

import services from "../data/services";

const Services = () => {
  const manager = useAppSelector(
    (state) => state.manager.managers[state.manager.active!],
  );
  const basePrices = useAppSelector((state) => state.game.serviceBasePrices);
  const dispatch = useAppDispatch();

  return (
    <HeaderedPage>
      <Header back />
      <ManagerInfo details />

      <Box p={1}>
        <h2>Erikoistoimenpiteet</h2>

        <div className={styles.servicesList}>
          {Object.entries(services).map(([key, service]) => {
            const basePrice = basePrices[key];
            return (
              <div key={key}>
                <div>
                  <Toggle
                    id={key}
                    checked={manager.services[key]}
                    onChange={() => dispatch(managerToggleService({ manager: manager.id, service: key }))}
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

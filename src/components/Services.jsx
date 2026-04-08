import React from "react";
import Header from "./containers/HeaderContainer";
import HeaderedPage from "./ui/HeaderedPage";
import ManagerInfo from "./containers/ManagerInfoContainer";
import styled from "styled-components";
import Toggle from "react-toggle";
import Markdown from "react-markdown";
import Box from "./styled-system/Box";

import services from "../data/services";

const ServicesList = styled.div`
  margin: 1em 0;
`;

const Services = (props) => {
  const { manager, toggleService, basePrices } = props;

  return (
    <HeaderedPage>
      <Header back />
      <ManagerInfo details />

      <Box p={1}>
        <h2>Erikoistoimenpiteet</h2>

        <ServicesList>
          {services
            .map((service, key) => {
              const basePrice = basePrices[key];
              return (
                <div key={key}>
                  <div>
                    <Toggle
                      id={key}
                      checked={manager.services[key]}
                      onChange={() => {
                        toggleService(manager.id, key);
                      }}
                    />
                    <label htmlFor={key}>
                      <strong>{service.get("name")}</strong>
                    </label>
                  </div>

                  <Markdown>
                    {service.get("description")(
                      service.get("price")(basePrice, manager)
                    )}
                  </Markdown>
                </div>
              );
            })
            .toList()}
        </ServicesList>
      </Box>
    </HeaderedPage>
  );
};

export default Services;

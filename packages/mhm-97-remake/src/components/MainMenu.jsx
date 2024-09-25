import Events from "./events/Events";
import Situation from "./context-sensitive/Situation";
import ManagerInfo from "./containers/ManagerInfoContainer";
import Header from "./containers/HeaderContainer";
import HeaderedPage from "./ui/HeaderedPage";
import Forward from "./context-sensitive/containers/ForwardContainer";
import Current from "./context-sensitive/containers/CurrentContainer";

import Box from "./styled-system/Box";

import * as stylex from "@stylexjs/stylex";
import { sizes } from "@stylexjs/open-props/lib/sizes.stylex";

const styles = stylex.create({
  box: {
    paddingInline: {
      default: sizes.spacing3
    },
    containerType: "inline-size"
  }
});

const MainMenu = (props) => {
  const {
    manager,
    teams,
    competitions,
    resolveEvent,
    events,
    interestingCompetitions
  } = props;

  return (
    <HeaderedPage>
      <Header menu forward={<Forward />} />

      <ManagerInfo details />

      <Box style={styles.box}>
        <Current />

        <Situation
          manager={manager}
          competitions={competitions}
          interesting={interestingCompetitions}
          teams={teams}
        />

        <Events manager={manager} events={events} resolveEvent={resolveEvent} />
      </Box>
    </HeaderedPage>
  );
};

export default MainMenu;

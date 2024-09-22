import { amount } from "../services/format";
import { getEffective } from "../services/effects";

import TurnIndicator from "./game/TurnIndicator";

import * as stylex from "@stylexjs/stylex";
import { colors } from "@stylexjs/open-props/lib/colors.stylex";
import { sizes } from "@stylexjs/open-props/lib/sizes.stylex";
import { fonts } from "@stylexjs/open-props/lib/fonts.stylex";

const styles = stylex.create({
  box: {
    padding: sizes.spacing3,
    backgroundColor: `light-dark(${colors.gray3}, ${colors.gray12})`
    // color: `light-dark(${colors.gray5}, ${colors.gray12})`
  },
  header: {
    margin: 0
  },
  details: {
    marginTop: sizes.spacing3,
    display: "flex",
    flexBasis: "100%",
    flexWrap: "wrap",
    alignItems: "stretch"
  },
  detail: {
    flexShrink: 0,
    width: "50%",
    display: "flex"
  },
  title: {
    fontWeight: fonts.weight9,
    paddingRight: sizes.spacing2
  }
});

const ManagerInfo = (props) => {
  const { manager, teams, turn, details = false } = props;

  const team = getEffective(teams.get(manager.get("team")));

  return (
    <div {...stylex.props(styles.box)}>
      <h2 {...stylex.props(styles.header)}>{manager.get("name")}</h2>

      {details && (
        <div {...stylex.props(styles.details)}>
          <div {...stylex.props(styles.detail)}>
            <div {...stylex.props(styles.title)}>Voima</div>
            <div>{team.get("strength")}</div>
          </div>

          <div {...stylex.props(styles.detail)}>
            <div {...stylex.props(styles.title)}>Moraali</div>
            <div>{team.get("morale")}</div>
          </div>

          <div {...stylex.props(styles.detail)}>
            <div {...stylex.props(styles.title)}>Raha</div>
            <div>{amount(manager.get("balance"))}</div>
          </div>

          <div {...stylex.props(styles.detail)}>
            <div {...stylex.props(styles.title)}>Vuoro</div>
            <div>
              <TurnIndicator turn={turn} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerInfo;

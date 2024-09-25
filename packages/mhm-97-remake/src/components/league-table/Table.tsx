import * as stylex from "@stylexjs/stylex";
import { Tr } from "./Tr";
import { colors } from "@stylexjs/open-props/lib/colors.stylex";
import { Th } from "./Th";
import { Td } from "./Td";
import { TableContainer } from "./TableContainer";

const styles = stylex.create({
  table: {}
});

const Table = (props) => {
  const { managers, teams, division } = props;
  const colors = division.get("colors");
  const tbl = division.get("stats").map((entry) => {
    return entry.set(
      "managerControlled",
      managers.map((p) => p.get("team")).includes(entry.get("id"))
    );
  });

  return (
    <TableContainer>
      <table {...stylex.props(styles.table)} border={2}>
        <thead>
          <Tr>
            <Th sticky>Joukkue</Th>
            <Th>O</Th>
            <Th>V</Th>
            <Th>TP</Th>
            <Th>H</Th>
            <Th>TM</Th>
            <Th>-</Th>
            <Th>PM</Th>
            <Th>P</Th>
          </Tr>
        </thead>
        <tbody>
          {tbl.map((t, i) => {
            return (
              <Tr key={t.get("id")} dark={colors.get(i) === "d"}>
                <Td sticky>
                  {t.get("managerControlled") ? (
                    <strong>{teams.getIn([t.get("id"), "name"])}</strong>
                  ) : (
                    teams.getIn([t.get("id"), "name"])
                  )}
                </Td>
                <Td>{t.get("gamesPlayed")}</Td>
                <Td>{t.get("wins")}</Td>
                <Td>{t.get("draws")}</Td>
                <Td>{t.get("losses")}</Td>

                <Td align="right">{t.get("goalsFor")}</Td>
                <Td>-</Td>
                <Td>{t.get("goalsAgainst")}</Td>
                <Td>{t.get("points")}</Td>
              </Tr>
            );
          })}
        </tbody>
      </table>
    </TableContainer>
  );
};

export default Table;

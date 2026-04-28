import Header from "./Header";
import HeaderedPage from "./ui/HeaderedPage";
import { getEffective } from "@/services/effects";
import Box from "./ui/Box";
import { useGameContext } from "@/context/game-machine-context";
import { values } from "remeda";
import { Table, Td, Th } from "./ui/Table";

const DeveloperMenu = () => {
  const teams = useGameContext((ctx) => ctx.teams);
  const competitions = useGameContext((ctx) => ctx.competitions);

  return (
    <HeaderedPage>
      <Header back />

      <Box p="md">
        <h2>Devausinfo</h2>

        {values(competitions).map((c) => {
          return (
            <div key={c.id}>
              <h2>{c.name}</h2>
              <Table>
                <thead>
                  <tr>
                    <Th>Joukkue</Th>
                    <Th>O-voima</Th>
                    <Th>E-voima</Th>
                    <Th>E-moraali</Th>
                    <Th>E-valmius</Th>
                  </tr>
                </thead>

                <tbody>
                  {c.teams
                    .toSorted((a, b) => teams[b].strength - teams[a].strength)
                    .map((t) => {
                      const team = teams[t];
                      const e = getEffective(team);

                      return (
                        <tr key={team.id}>
                          <Td>{team.name}</Td>
                          <Td>{team.strength}</Td>
                          <Td>{e.strength}</Td>
                          <Td>{e.morale}</Td>
                          <Td>{e.readiness}</Td>
                        </tr>
                      );
                    })}
                </tbody>
              </Table>
            </div>
          );
        })}
      </Box>
    </HeaderedPage>
  );
};

export default DeveloperMenu;

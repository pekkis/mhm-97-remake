import { useState } from "react";
import type { FC } from "react";
import Tabs from "../ui/Tabs";
import Tab from "../ui/Tab";
import Season from "../data/Season";
import ResponsiveTable from "../responsive-table/ResponsiveTable";
import Table from "../responsive-table/Table";
import Td from "../responsive-table/Td";

type TeamStatsProps = {
  stats: any;
  teams: any;
  countries: Record<string, { name: string }>;
};

const TeamStats: FC<TeamStatsProps> = ({ stats, teams, countries }) => {
  const [tab, setTab] = useState(0);

  return (
    <Tabs selected={tab} onSelect={setTab}>
      <Tab title="Mitalistit">
        <ResponsiveTable>
          <Table>
            <thead>
              <tr>
                <th className="fixed">Vuosi</th>
                <th>Kultaa</th>
                <th>Hopeaa</th>
                <th>Pronssia</th>
              </tr>
            </thead>
            <tbody>
              {stats
                .get("seasons")
                .map((season: any, seasonIndex: number) => {
                  return (
                    <tr key={season}>
                      <Td className="fixed">
                        <Season index={seasonIndex} />
                      </Td>
                      {season.get("medalists").map((m: string, k: number) => (
                        <td key={k}>{teams[m]?.name}</td>
                      ))}
                    </tr>
                  );
                })
                .reverse()}
            </tbody>
          </Table>
        </ResponsiveTable>
      </Tab>
      <Tab title="Runkosarjan voittaja">
        <table>
          <thead>
            <tr>
              <th>Vuosi</th>
              <th>Runkosarjan voittaja</th>
            </tr>
          </thead>
          <tbody>
            {stats
              .get("seasons")
              .map((season: any, seasonIndex: number) => {
                return (
                  <tr key={season}>
                    <td>
                      <Season index={seasonIndex} />
                    </td>
                    <td>
                      {teams[season.get("presidentsTrophy")]?.name}
                    </td>
                  </tr>
                );
              })
              .reverse()}
          </tbody>
        </table>
      </Tab>
      <Tab title="Nousijat / putoajat">
        <table>
          <thead>
            <tr>
              <th>Vuosi</th>
              <th>Nousija</th>
              <th>Putoaja</th>
            </tr>
          </thead>
          <tbody>
            {stats
              .get("seasons")
              .map((season: any, seasonIndex: number) => {
                return (
                  <tr key={season}>
                    <td>
                      <Season index={seasonIndex} />
                    </td>
                    <td>
                      {teams[season.get("promoted")]?.name ?? "-"}
                    </td>
                    <td>
                      {teams[season.get("relegated")]?.name ?? "-"}
                    </td>
                  </tr>
                );
              })
              .reverse()}
          </tbody>
        </table>
      </Tab>
      <Tab title="EHL">
        <table>
          <thead>
            <tr>
              <th>Vuosi</th>
              <th>Euroopan mestari</th>
            </tr>
          </thead>
          <tbody>
            {stats
              .get("seasons")
              .map((season: any, seasonIndex: number) => {
                return (
                  <tr key={season}>
                    <td>
                      <Season index={seasonIndex} />
                    </td>
                    <td>{teams[season.get("ehlChampion")]?.name}</td>
                  </tr>
                );
              })
              .reverse()}
          </tbody>
        </table>
      </Tab>
      <Tab title="MM-kisat">
        <ResponsiveTable>
          <Table>
            <thead>
              <tr>
                <th className="fixed">Vuosi</th>
                <th>Kultaa</th>
                <th>Hopeaa</th>
                <th>Pronssia</th>
              </tr>
            </thead>
            <tbody>
              {stats
                .get("seasons")
                .map((season: any, seasonIndex: number) => {
                  return (
                    <tr key={season}>
                      <Td className="fixed">
                        <Season index={seasonIndex} />
                      </Td>
                      {season
                        .get("worldChampionships")
                        .take(3)
                        .map((m: string, k: number) => (
                          <td key={k}>{countries?.[m]?.name}</td>
                        ))}
                    </tr>
                  );
                })
                .reverse()}
            </tbody>
          </Table>
        </ResponsiveTable>
      </Tab>
    </Tabs>
  );
};

export default TeamStats;

import News from "./news/News";
import Header from "./Header";
import HeaderedPage from "./ui/HeaderedPage";

import Box from "./styled-system/Box";
import { useAppSelector } from "@/config/redux";

const Gala = () => {
  const news = useAppSelector((state) => state.news.news);

  return (
    <HeaderedPage>
      <Header forward="Jo riittää lätinä, asiaan!" />

      <Box p={1}>
        <h2>Loppuottelugaala</h2>

        <News news={news} />
      </Box>
    </HeaderedPage>
  );
};

export default Gala;

import Header from "../components/header/Header";
import ForecastPanel from "../components/forecast/ForecastPanel";
import ChanceOfRain from "../components/chance-of-rain/ChanceOfrain";
import GlobalMap from "../components/global-map/GlobalMap";
import OtherLargeCities from "../components/cities/OtherLargeCities";

export default function Home() {
  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-(--background) text-foreground xl:h-screen xl:overflow-hidden">
      <div className="flex min-h-screen flex-col px-4 py-4 sm:px-6 xl:h-full xl:px-10 xl:py-6 2xl:px-16">
        <Header />

        {/* DASHBOARD AREA */}
        <div className="mt-4 flex flex-col gap-4 xl:mt-6 xl:flex-1 xl:overflow-hidden">
          {/* GÓRA */}
          <section className="grid grid-cols-1 gap-4 xl:grid-cols-12 xl:flex-[1.3]">
            <ForecastPanel />
            <ChanceOfRain />
          </section>

          {/* DÓŁ */}
          <section className="grid grid-cols-1 gap-4 xl:grid-cols-12 xl:flex-[1.7] xl:overflow-hidden">
            <GlobalMap />
            <OtherLargeCities />
          </section>
        </div>
      </div>
    </main>
  );
}
"use client";

import usePartnerAnalytics from "@/lib/swr/use-partner-analytics";
import useProgramEnrollment from "@/lib/swr/use-program-enrollment";
import Areas from "@/ui/charts/areas";
import { ChartContext } from "@/ui/charts/chart-context";
import TimeSeriesChart from "@/ui/charts/time-series-chart";
import XAxis from "@/ui/charts/x-axis";
import YAxis from "@/ui/charts/y-axis";
import { ProgramCommissionDescription } from "@/ui/programs/program-commission-description";
import SimpleDateRangePicker from "@/ui/shared/simple-date-range-picker";
import { MiniAreaChart } from "@dub/blocks";
import {
  Button,
  buttonVariants,
  Check2,
  MaxWidthWrapper,
  useCopyToClipboard,
  useRouterStuff,
} from "@dub/ui";
import { Copy, LoadingSpinner, MoneyBill2 } from "@dub/ui/src/icons";
import {
  cn,
  currencyFormatter,
  formatDate,
  getPrettyUrl,
  nFormatter,
} from "@dub/utils";
import { LinearGradient } from "@visx/gradient";
import { endOfDay, startOfDay, subDays } from "date-fns";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createContext, useContext, useId, useMemo } from "react";
import { HeroBackground } from "./hero-background";
import { SaleTablePartner } from "./sales/sale-table";

const ProgramOverviewContext = createContext<{
  start?: Date;
  end?: Date;
  interval?: string;
  color?: string;
}>({});

export default function ProgramPageClient() {
  const { searchParams } = useRouterStuff();
  const { partnerId, programId } = useParams();

  const { programEnrollment } = useProgramEnrollment();
  const [copied, copyToClipboard] = useCopyToClipboard();

  const { start, end } = useMemo(() => {
    const hasRange = searchParams?.has("start") && searchParams?.has("end");

    return {
      start: hasRange
        ? startOfDay(
            new Date(searchParams?.get("start") || subDays(new Date(), 1)),
          )
        : undefined,

      end: hasRange
        ? endOfDay(new Date(searchParams?.get("end") || new Date()))
        : undefined,
    };
  }, [searchParams?.get("start"), searchParams?.get("end")]);

  const interval =
    start || end ? undefined : searchParams?.get("interval") ?? "30d";

  const program = programEnrollment?.program;
  const color =
    program?.id === "prog_MqN7G1vSbuSELpYJwioHyDE8" ? "#8B5CF6" : undefined;

  return (
    <MaxWidthWrapper className="pb-10">
      <div className="relative flex flex-col rounded-lg border border-neutral-300 bg-gradient-to-r from-neutral-50 p-4 md:p-6">
        {program && <HeroBackground logo={program?.logo} color={color} />}
        <span className="flex items-center gap-2 text-sm text-neutral-500">
          <MoneyBill2 className="size-4" />
          Refer and earn
        </span>
        <div className="relative mt-24 text-lg text-neutral-900 sm:max-w-[50%]">
          {program ? (
            <ProgramCommissionDescription program={program} />
          ) : (
            <div className="mb-7 h-7 w-full animate-pulse rounded-md bg-neutral-200" />
          )}
        </div>
        <span className="mb-1.5 mt-6 block text-sm text-neutral-800">
          Referral link
        </span>
        <div className="xs:flex-row relative flex flex-col items-center gap-2">
          {programEnrollment?.link ? (
            <input
              type="text"
              readOnly
              value={getPrettyUrl(programEnrollment?.link.shortLink)}
              className="xs:w-auto h-10 w-full rounded-md border border-neutral-300 px-3 text-sm focus:border-gray-500 focus:outline-none focus:ring-gray-500 lg:min-w-64 xl:min-w-72"
            />
          ) : (
            <div className="h-10 w-16 animate-pulse rounded-md bg-neutral-200 lg:w-72" />
          )}
          <Button
            icon={
              copied ? (
                <Check2 className="size-4" />
              ) : (
                <Copy className="size-4" />
              )
            }
            text={copied ? "Copied link" : "Copy link"}
            className="xs:w-fit"
            onClick={() =>
              copyToClipboard(getPrettyUrl(programEnrollment?.link?.shortLink))
            }
          />
        </div>
      </div>
      <ProgramOverviewContext.Provider value={{ start, end, interval, color }}>
        <div className="mt-6 rounded-lg border border-neutral-300">
          <div className="p-4 md:p-6 md:pb-4">
            <EarningsChart />
          </div>
        </div>
        <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-3">
          <StatCard title="Clicks" event="clicks" />
          <StatCard title="Leads" event="leads" />
          <StatCard title="Sales" event="sales" />
        </div>
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-medium text-neutral-900">
              Recent sales
            </h2>
            <Link
              href={`/${partnerId}/${programId}/sales`}
              className={cn(
                buttonVariants({ variant: "secondary" }),
                "flex h-8 items-center rounded-lg border px-2 text-sm",
              )}
            >
              View all
            </Link>
          </div>
          <div className="mt-4">
            <SaleTablePartner limit={10} />
          </div>
        </div>
      </ProgramOverviewContext.Provider>
    </MaxWidthWrapper>
  );
}

function EarningsChart() {
  const { queryParams } = useRouterStuff();
  const id = useId();

  const { start, end, interval, color } = useContext(ProgramOverviewContext);

  const { data: { earnings: total } = {} } = usePartnerAnalytics({
    interval: interval as any,
    start,
    end,
  });
  const { data: timeseries, error } = usePartnerAnalytics({
    groupBy: "timeseries",
    interval: interval as any,
    start,
    end,
  });

  const data = useMemo(
    () =>
      timeseries?.map(({ start, earnings }) => ({
        date: new Date(start),
        values: { earnings: earnings / 100 },
      })),
    [timeseries],
  );

  return (
    <div>
      <div className="flex flex-col-reverse items-start justify-between gap-4 md:flex-row">
        <div>
          <span className="block text-sm text-neutral-500">Earnings</span>
          <div className="mt-1.5">
            {total !== undefined ? (
              <span className="text-2xl leading-none text-neutral-800">
                {currencyFormatter(total / 100, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            ) : (
              <div className="h-7 w-24 animate-pulse rounded-md bg-neutral-200" />
            )}
          </div>
        </div>
        <div className="w-full md:w-auto">
          <SimpleDateRangePicker className="h-8 w-full md:w-fit" />
        </div>
      </div>
      <div className="relative mt-4 h-64 w-full">
        {data ? (
          <TimeSeriesChart
            data={data}
            series={[
              {
                id: "earnings",
                valueAccessor: (d) => d.values.earnings,
                colorClassName: color ? `text-[${color}]` : "text-violet-500",
                isActive: true,
              },
            ]}
            tooltipClassName="p-0"
            tooltipContent={(d) => {
              return (
                <>
                  <p className="border-b border-gray-200 px-4 py-3 text-sm text-gray-900">
                    {formatDate(d.date)}
                  </p>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "h-2 w-2 rounded-sm shadow-[inset_0_0_0_1px_#0003]",
                          color ? `bg-[${color}]` : "bg-violet-500",
                        )}
                      />
                      <p className="capitalize text-gray-600">Earnings</p>
                    </div>
                    <p className="text-right font-medium text-gray-900">
                      {currencyFormatter(d.values.earnings, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                </>
              );
            }}
          >
            <ChartContext.Consumer>
              {(context) => (
                <LinearGradient
                  id={`${id}-color-gradient`}
                  from={color || "#7D3AEC"}
                  to={color || "#DA2778"}
                  x1={0}
                  x2={context?.width ?? 1}
                  gradientUnits="userSpaceOnUse"
                />
              )}
            </ChartContext.Consumer>

            <XAxis />
            <YAxis showGridLines />
            <Areas
              seriesStyles={[
                {
                  id: "earnings",
                  areaFill: `url(#${id}-color-gradient)`,
                  lineStroke: `url(#${id}-color-gradient)`,
                  lineClassName: `text-[${color}]`,
                },
              ]}
            />
          </TimeSeriesChart>
        ) : (
          <div className="flex size-full items-center justify-center">
            {error ? (
              <span className="text-sm text-neutral-500">
                Failed to load earnings data.
              </span>
            ) : (
              <LoadingSpinner />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  title,
  event,
}: {
  title: string;
  event: "clicks" | "leads" | "sales";
}) {
  const { partnerId, programId } = useParams();
  const { start, end, interval, color } = useContext(ProgramOverviewContext);

  const { data: total } = usePartnerAnalytics({
    interval: interval as any,
    start,
    end,
  });
  const { data: timeseries, error } = usePartnerAnalytics({
    groupBy: "timeseries",
    interval: interval as any,
    start,
    end,
    event,
  });

  return (
    <Link
      href={`/${partnerId}/${programId}/analytics?event=${event}`}
      className="hover:drop-shadow-card-hover block rounded-md border border-neutral-300 bg-white p-5 transition-[filter]"
    >
      <span className="block text-sm text-neutral-500">{title}</span>
      {total !== undefined ? (
        <span className="block text-2xl text-neutral-800">
          {nFormatter(total[event])}
        </span>
      ) : (
        <div className="h-8 w-16 animate-pulse rounded-md bg-neutral-200" />
      )}
      <div className="mt-2 h-16 w-full">
        {timeseries ? (
          <MiniAreaChart
            data={timeseries.map((d) => ({
              date: new Date(d.start),
              value: d[event],
            }))}
            curve={false}
            color={color}
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            {error ? (
              <span className="text-sm text-neutral-500">
                Failed to load data.
              </span>
            ) : (
              <LoadingSpinner />
            )}
          </div>
        )}
      </div>
    </Link>
  );
}

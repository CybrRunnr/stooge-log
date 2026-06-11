import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";

import { getDb, schema } from "@/db";
import { getVoteTally } from "@/server/votes";

import { GameCard } from "./game-card";
import { ProposeForm } from "./propose-form";

export const metadata: Metadata = { title: "Backlog" };

const SECTIONS: { status: (typeof schema.gameStatus.enumValues)[number]; heading: string }[] = [
	{ status: "playing", heading: "Now playing" },
	{ status: "backlog", heading: "Backlog" },
	{ status: "proposed", heading: "Proposed" },
	{ status: "completed", heading: "Completed" },
	{ status: "abandoned", heading: "Abandoned" },
	{ status: "rejected", heading: "Rejected" },
];

export default async function BacklogPage() {
	const db = getDb();
	const [rows, tally] = await Promise.all([
		db
			.select({
				game: schema.games,
				metadata: schema.gameMetadata,
				proposerName: schema.user.name,
			})
			.from(schema.games)
			.leftJoin(schema.gameMetadata, eq(schema.games.id, schema.gameMetadata.gameId))
			.leftJoin(schema.user, eq(schema.games.proposedBy, schema.user.id))
			.orderBy(desc(schema.games.createdAt)),
		getVoteTally(),
	]);
	const tallyByGame = new Map(tally.map((entry) => [entry.gameId, entry.totalWeight]));

	return (
		<div className="flex flex-col gap-8">
			<div>
				<h1 className="text-2xl font-semibold tracking-tight">Backlog</h1>
				<p className="text-muted-foreground mt-1 text-sm">
					Everything the group plans to play, is playing, or has finished.
				</p>
			</div>

			<ProposeForm />

			{rows.length === 0 && (
				<p className="text-muted-foreground text-sm">
					Nothing here yet — propose the first game above.
				</p>
			)}

			{SECTIONS.map(({ status, heading }) => {
				const sectionRows = rows.filter((row) => row.game.status === status);
				if (sectionRows.length === 0) return null;
				if (status === "backlog") {
					// Group priority order — what voting is for.
					sectionRows.sort(
						(a, b) =>
							(tallyByGame.get(b.game.id) ?? 0) - (tallyByGame.get(a.game.id) ?? 0)
					);
				}
				return (
					<section key={status} className="flex flex-col gap-3">
						<h2 className="text-sm font-medium tracking-wide uppercase">
							{heading}
							<span className="text-muted-foreground ml-2 font-normal">
								{sectionRows.length}
							</span>
						</h2>
						<div className="flex flex-col gap-3">
							{sectionRows.map((row) => (
								<GameCard
									key={row.game.id}
									game={row.game}
									metadata={row.metadata}
									proposerName={row.proposerName}
									voteTotal={
										status === "backlog" ? (tallyByGame.get(row.game.id) ?? 0) : undefined
									}
								/>
							))}
						</div>
					</section>
				);
			})}
		</div>
	);
}

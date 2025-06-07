-- CreateEnum
CREATE TYPE "game_status" AS ENUM ('PLAYING', 'FINISHED', 'PAUSED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "session_status" AS ENUM ('CONNECTED', 'DISCONNECTED', 'RECONNECTED');

-- CreateEnum
CREATE TYPE "suit" AS ENUM ('HEARTS', 'DIAMONDS', 'CLUBS', 'SPADES');

-- CreateEnum
CREATE TYPE "rank" AS ENUM ('ACE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN', 'JACK', 'QUEEN', 'KING');

-- CreateEnum
CREATE TYPE "player_position" AS ENUM ('NORTH', 'EAST', 'SOUTH', 'WEST');

-- CreateTable
CREATE TABLE "players" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "display_order" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cards" (
    "id" SERIAL NOT NULL,
    "suit" "suit" NOT NULL,
    "rank" "rank" NOT NULL,
    "code" TEXT NOT NULL,
    "point_value" INTEGER NOT NULL DEFAULT 0,
    "sort_order" INTEGER NOT NULL,

    CONSTRAINT "cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "games" (
    "id" SERIAL NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_time" TIMESTAMP(3),
    "status" "game_status" NOT NULL DEFAULT 'PLAYING',
    "winner_id" INTEGER,
    "duration" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "games_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hands" (
    "id" SERIAL NOT NULL,
    "game_id" INTEGER NOT NULL,
    "hand_number" INTEGER NOT NULL,
    "shoot_the_moon_player_id" INTEGER,
    "hearts_broken" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hand_cards" (
    "id" SERIAL NOT NULL,
    "hand_id" INTEGER NOT NULL,
    "player_id" INTEGER NOT NULL,
    "card_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hand_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "card_exchanges" (
    "id" SERIAL NOT NULL,
    "hand_id" INTEGER NOT NULL,
    "from_player_id" INTEGER NOT NULL,
    "to_player_id" INTEGER NOT NULL,
    "card_id" INTEGER NOT NULL,
    "exchange_order" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "card_exchanges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tricks" (
    "id" SERIAL NOT NULL,
    "hand_id" INTEGER NOT NULL,
    "trick_number" INTEGER NOT NULL,
    "winner_player_id" INTEGER NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "lead_player_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tricks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trick_cards" (
    "id" SERIAL NOT NULL,
    "trick_id" INTEGER NOT NULL,
    "player_id" INTEGER NOT NULL,
    "card_id" INTEGER NOT NULL,
    "play_order" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trick_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hand_scores" (
    "id" SERIAL NOT NULL,
    "hand_id" INTEGER NOT NULL,
    "player_id" INTEGER NOT NULL,
    "hand_points" INTEGER NOT NULL,
    "cumulative_points" INTEGER NOT NULL,
    "hearts_taken" INTEGER NOT NULL DEFAULT 0,
    "queen_of_spades_taken" BOOLEAN NOT NULL DEFAULT false,
    "shoot_the_moon_achieved" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hand_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_sessions" (
    "id" SERIAL NOT NULL,
    "game_id" INTEGER NOT NULL,
    "player_id" INTEGER NOT NULL,
    "session_id" TEXT NOT NULL,
    "socket_id" TEXT,
    "player_position" "player_position",
    "status" "session_status" NOT NULL DEFAULT 'CONNECTED',
    "connected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "disconnected_at" TIMESTAMP(3),

    CONSTRAINT "game_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_statistics" (
    "id" SERIAL NOT NULL,
    "player_id" INTEGER NOT NULL,
    "total_games" INTEGER NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "win_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "average_score" DOUBLE PRECISION,
    "best_score" INTEGER,
    "worst_score" INTEGER,
    "total_score" INTEGER NOT NULL DEFAULT 0,
    "total_hearts_taken" INTEGER NOT NULL DEFAULT 0,
    "total_queen_of_spades_taken" INTEGER NOT NULL DEFAULT 0,
    "shoot_the_moon_count" INTEGER NOT NULL DEFAULT 0,
    "current_streak" INTEGER NOT NULL DEFAULT 0,
    "best_streak" INTEGER NOT NULL DEFAULT 0,
    "total_play_time" INTEGER NOT NULL DEFAULT 0,
    "average_game_time" DOUBLE PRECISION,
    "last_played_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "player_statistics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monthly_statistics" (
    "id" SERIAL NOT NULL,
    "year_month" TEXT NOT NULL,
    "player_id" INTEGER NOT NULL,
    "games_played" INTEGER NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "average_score" DOUBLE PRECISION,
    "best_score" INTEGER,

    CONSTRAINT "monthly_statistics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "players_name_key" ON "players"("name");

-- CreateIndex
CREATE INDEX "players_name_idx" ON "players"("name");

-- CreateIndex
CREATE INDEX "players_display_order_idx" ON "players"("display_order");

-- CreateIndex
CREATE UNIQUE INDEX "cards_code_key" ON "cards"("code");

-- CreateIndex
CREATE INDEX "cards_suit_rank_idx" ON "cards"("suit", "rank");

-- CreateIndex
CREATE INDEX "cards_code_idx" ON "cards"("code");

-- CreateIndex
CREATE INDEX "games_start_time_idx" ON "games"("start_time" DESC);

-- CreateIndex
CREATE INDEX "games_status_idx" ON "games"("status");

-- CreateIndex
CREATE INDEX "games_winner_id_idx" ON "games"("winner_id");

-- CreateIndex
CREATE INDEX "hands_game_id_idx" ON "hands"("game_id");

-- CreateIndex
CREATE UNIQUE INDEX "hands_game_id_hand_number_key" ON "hands"("game_id", "hand_number");

-- CreateIndex
CREATE INDEX "hand_cards_hand_id_player_id_idx" ON "hand_cards"("hand_id", "player_id");

-- CreateIndex
CREATE UNIQUE INDEX "hand_cards_hand_id_card_id_key" ON "hand_cards"("hand_id", "card_id");

-- CreateIndex
CREATE INDEX "card_exchanges_hand_id_from_player_id_idx" ON "card_exchanges"("hand_id", "from_player_id");

-- CreateIndex
CREATE INDEX "card_exchanges_hand_id_to_player_id_idx" ON "card_exchanges"("hand_id", "to_player_id");

-- CreateIndex
CREATE INDEX "tricks_hand_id_idx" ON "tricks"("hand_id");

-- CreateIndex
CREATE UNIQUE INDEX "tricks_hand_id_trick_number_key" ON "tricks"("hand_id", "trick_number");

-- CreateIndex
CREATE INDEX "trick_cards_trick_id_idx" ON "trick_cards"("trick_id");

-- CreateIndex
CREATE UNIQUE INDEX "trick_cards_trick_id_play_order_key" ON "trick_cards"("trick_id", "play_order");

-- CreateIndex
CREATE UNIQUE INDEX "trick_cards_trick_id_card_id_key" ON "trick_cards"("trick_id", "card_id");

-- CreateIndex
CREATE INDEX "hand_scores_player_id_idx" ON "hand_scores"("player_id");

-- CreateIndex
CREATE INDEX "hand_scores_hand_id_idx" ON "hand_scores"("hand_id");

-- CreateIndex
CREATE UNIQUE INDEX "hand_scores_hand_id_player_id_key" ON "hand_scores"("hand_id", "player_id");

-- CreateIndex
CREATE UNIQUE INDEX "game_sessions_session_id_key" ON "game_sessions"("session_id");

-- CreateIndex
CREATE INDEX "game_sessions_game_id_player_id_idx" ON "game_sessions"("game_id", "player_id");

-- CreateIndex
CREATE INDEX "game_sessions_session_id_idx" ON "game_sessions"("session_id");

-- CreateIndex
CREATE UNIQUE INDEX "player_statistics_player_id_key" ON "player_statistics"("player_id");

-- CreateIndex
CREATE INDEX "player_statistics_win_rate_idx" ON "player_statistics"("win_rate" DESC);

-- CreateIndex
CREATE INDEX "player_statistics_total_games_idx" ON "player_statistics"("total_games" DESC);

-- CreateIndex
CREATE INDEX "monthly_statistics_year_month_idx" ON "monthly_statistics"("year_month");

-- CreateIndex
CREATE INDEX "monthly_statistics_player_id_idx" ON "monthly_statistics"("player_id");

-- CreateIndex
CREATE UNIQUE INDEX "monthly_statistics_year_month_player_id_key" ON "monthly_statistics"("year_month", "player_id");

-- AddForeignKey
ALTER TABLE "games" ADD CONSTRAINT "games_winner_id_fkey" FOREIGN KEY ("winner_id") REFERENCES "players"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hands" ADD CONSTRAINT "hands_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hands" ADD CONSTRAINT "hands_shoot_the_moon_player_id_fkey" FOREIGN KEY ("shoot_the_moon_player_id") REFERENCES "players"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hand_cards" ADD CONSTRAINT "hand_cards_hand_id_fkey" FOREIGN KEY ("hand_id") REFERENCES "hands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hand_cards" ADD CONSTRAINT "hand_cards_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hand_cards" ADD CONSTRAINT "hand_cards_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "cards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_exchanges" ADD CONSTRAINT "card_exchanges_hand_id_fkey" FOREIGN KEY ("hand_id") REFERENCES "hands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_exchanges" ADD CONSTRAINT "card_exchanges_from_player_id_fkey" FOREIGN KEY ("from_player_id") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_exchanges" ADD CONSTRAINT "card_exchanges_to_player_id_fkey" FOREIGN KEY ("to_player_id") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_exchanges" ADD CONSTRAINT "card_exchanges_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "cards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tricks" ADD CONSTRAINT "tricks_hand_id_fkey" FOREIGN KEY ("hand_id") REFERENCES "hands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tricks" ADD CONSTRAINT "tricks_winner_player_id_fkey" FOREIGN KEY ("winner_player_id") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tricks" ADD CONSTRAINT "tricks_lead_player_id_fkey" FOREIGN KEY ("lead_player_id") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trick_cards" ADD CONSTRAINT "trick_cards_trick_id_fkey" FOREIGN KEY ("trick_id") REFERENCES "tricks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trick_cards" ADD CONSTRAINT "trick_cards_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trick_cards" ADD CONSTRAINT "trick_cards_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "cards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hand_scores" ADD CONSTRAINT "hand_scores_hand_id_fkey" FOREIGN KEY ("hand_id") REFERENCES "hands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hand_scores" ADD CONSTRAINT "hand_scores_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_sessions" ADD CONSTRAINT "game_sessions_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_sessions" ADD CONSTRAINT "game_sessions_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_statistics" ADD CONSTRAINT "player_statistics_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monthly_statistics" ADD CONSTRAINT "monthly_statistics_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

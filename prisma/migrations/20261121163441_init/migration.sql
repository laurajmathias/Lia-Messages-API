-- CreateTable
CREATE TABLE `messages` (
    `messageId` VARCHAR(128) NOT NULL,
    `storeId` VARCHAR(64) NOT NULL,
    `phone` VARCHAR(20) NOT NULL,
    `text` TEXT NOT NULL,
    `timestamp` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `messages_phone_timestamp_idx`(`phone`, `timestamp`),
    PRIMARY KEY (`messageId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

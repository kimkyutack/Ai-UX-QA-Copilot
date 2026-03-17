"use client";

import { useState } from "react";
import styles from "./report-share-actions.module.css";

type ReportShareActionsProps = {
  reportId: string;
  showPrint?: boolean;
  compact?: boolean;
};

export function ReportShareActions({
  reportId,
  showPrint = false,
  compact = false,
}: ReportShareActionsProps) {
  const [notice, setNotice] = useState<string | null>(null);

  const sharePath = `/reports/${reportId}`;

  async function handleCopyLink() {
    const absoluteUrl = `${window.location.origin}${sharePath}`;

    try {
      await navigator.clipboard.writeText(absoluteUrl);
      setNotice("공유 링크를 복사했습니다.");
    } catch {
      setNotice("링크를 복사하지 못했습니다.");
    }

    window.setTimeout(() => {
      setNotice(null);
    }, 1800);
  }

  return (
    <div className={compact ? styles.compactWrap : styles.wrap}>
      <div className={styles.actions}>
        <a className={styles.linkButton} href={sharePath} target="_blank" rel="noreferrer">
          공유 페이지 열기
        </a>
        <button type="button" className={styles.secondaryButton} onClick={handleCopyLink}>
          링크 복사
        </button>
        {showPrint ? (
          <button type="button" className={styles.secondaryButton} onClick={() => window.print()}>
            인쇄 / PDF 저장
          </button>
        ) : null}
      </div>
      {notice ? <p className={styles.notice}>{notice}</p> : null}
    </div>
  );
}

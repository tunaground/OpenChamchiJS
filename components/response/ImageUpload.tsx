"use client";

import { useRef, useState, useEffect } from "react";
import styled from "styled-components";

const UploadContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 1.2rem;
  flex-wrap: wrap;
`;

const HiddenInput = styled.input`
  display: none;
`;

const UploadButton = styled.button`
  padding: 0.6rem 1.2rem;
  background: ${(props) => props.theme.surfaceHover};
  border: 1px solid ${(props) => props.theme.surfaceBorder};
  border-radius: 4px;
  font-size: 1.3rem;
  cursor: pointer;
  color: ${(props) => props.theme.textPrimary};

  &:hover {
    background: ${(props) => props.theme.surface};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Preview = styled.img`
  max-width: 40px;
  max-height: 40px;
  border-radius: 4px;
  border: 1px solid ${(props) => props.theme.surfaceBorder};
`;

const RemoveButton = styled.button`
  padding: 0.4rem 0.8rem;
  background: transparent;
  border: 1px solid ${(props) => props.theme.error || "#dc2626"};
  color: ${(props) => props.theme.error || "#dc2626"};
  border-radius: 4px;
  font-size: 1.2rem;
  cursor: pointer;

  &:hover {
    background: ${(props) => (props.theme.error || "#dc2626")}20;
  }
`;

const MaxSizeHint = styled.span`
  font-size: 1.2rem;
  color: ${(props) => props.theme.textSecondary};
`;

interface ImageUploadProps {
  onFileSelect: (file: File | null) => void;
  currentFile: File | null;
  maxSizeLabel: string;
  disabled?: boolean;
  labels: {
    selectImage: string;
    removeImage: string;
  };
}

export function ImageUpload({
  onFileSelect,
  currentFile,
  maxSizeLabel,
  disabled,
  labels,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (currentFile) {
      const url = URL.createObjectURL(currentFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [currentFile]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleRemove = () => {
    onFileSelect(null);
  };

  return (
    <UploadContainer>
      <HiddenInput
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        disabled={disabled}
      />
      <UploadButton
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || !!currentFile}
      >
        {labels.selectImage}
      </UploadButton>
      {!currentFile && (
        <MaxSizeHint>({maxSizeLabel})</MaxSizeHint>
      )}

      {previewUrl && (
        <>
          <Preview src={previewUrl} alt="Preview" />
          <RemoveButton type="button" onClick={handleRemove} disabled={disabled}>
            {labels.removeImage}
          </RemoveButton>
        </>
      )}
    </UploadContainer>
  );
}

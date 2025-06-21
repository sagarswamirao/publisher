import { Card, CardContent, CardMedia, styled } from "@mui/material";

export const StyledCard = styled(Card)({
   display: "flex",
   flexDirection: "column",
   height: "100%",
});

export const StyledCardContent = styled(CardContent)({
   display: "flex",
   flexDirection: "column",
   padding: "10px",
   flexGrow: 1,
});

export const StyledCardMedia = styled(CardMedia)({
   padding: "10px",
});

export const StyledExplorerPage = styled("div")({
   display: "flex",
   flexDirection: "column",
   height: "100%",
});

export const StyledExplorerBanner = styled("div")({
   height: "30px",
   backgroundColor: "rgba(225, 240, 255, 1)",
   display: "flex",
   padding: "4px",
   alignItems: "center",
});

export const StyledExplorerContent = styled("div")({
   display: "flex",
   height: "75vh",
   width: "100%",
   overflowY: "auto",
});

export const StyledExplorerPanel = styled("div")({
   position: "relative",
   height: "100%",
   flex: "0 0 auto",
});

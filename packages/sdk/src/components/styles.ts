import { styled, Card, CardContent, CardMedia } from "@mui/material";

export const StyledCard = styled(Card)({
   display: "flex",
   flexDirection: "column",
   height: "100%",
});

export const StyledCardContent = styled(CardContent)({
   display: "flex",
   flexDirection: "column",
   padding: "0px 10px 10px 10px",
   flexGrow: 1,
   "&:last-child": {
      paddingBottom: 0,
   },
});

export const StyledCardMedia = styled(CardMedia)({
   padding: "0px 10px 0px 10px",
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
   padding: "2px 10px",
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

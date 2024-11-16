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

import { createFileRoute } from "@tanstack/react-router";
import { FaAmbulance } from "react-icons/fa";
import { TbArrowDown, TbArrowRight, TbArrowUp, TbCircleCheck, TbClock, TbTrendingUp } from "react-icons/tb";
import { FloatingActionButton } from "@/components/layout/floating-action-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/_protected/dashboard")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <main className="grid lg:grid-cols-3 gap-6">
      <div>
        <Card size="sm">
          <CardHeader>
            <CardTitle>Balanço geral</CardTitle>
          </CardHeader>
          <CardContent>
            <strong className="text-4xl leading-1 text-primary">R$ 1.201.445,00</strong>
          </CardContent>
          <CardFooter>
            <Badge variant="emerald" size="lg">
              <TbTrendingUp /> +2,4% em relação ao mês passado
            </Badge>
          </CardFooter>
        </Card>
      </div>
      <div>
        <Card size="sm">
          <CardHeader>
            <CardTitle>Receita do mês</CardTitle>
          </CardHeader>
          <CardContent>
            <strong className="text-2xl leading-1">R$ 1.201.445,00</strong>
          </CardContent>
          <CardFooter>
            <Badge variant="emerald" size="lg">
              <TbArrowUp /> +3,4% em relação ao mês passado
            </Badge>
          </CardFooter>
        </Card>
      </div>
      <div>
        <Card size="sm">
          <CardHeader>
            <CardTitle>Despesa do mês</CardTitle>
          </CardHeader>
          <CardContent>
            <strong className="text-2xl leading-1">R$ 1.201.445,00</strong>
          </CardContent>
          <CardFooter>
            <Badge variant="emerald" size="lg">
              <TbArrowDown /> -7,4% em relação ao mês passado
            </Badge>
          </CardFooter>
        </Card>
      </div>
      <div>
        <Card size="sm">
          <CardHeader>
            <CardTitle>Despesa do mês</CardTitle>
          </CardHeader>
          <CardContent></CardContent>
        </Card>
      </div>
      <div className="col-span-2">
        <Card size="sm">
          <CardContent>
            <Table>
              <TableCaption>Lista de despesas.</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-center w-0">Situação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[].map((invoice) => {
                  return null;
                  return (
                    <TableRow key={invoice.invoice}>
                      <TableCell className="font-medium">{invoice.invoice}</TableCell>
                      <TableCell>{invoice.paymentStatus}</TableCell>
                      <TableCell>{invoice.paymentMethod}</TableCell>
                      <TableCell className="text-right">{invoice.totalAmount}</TableCell>
                    </TableRow>
                  );
                })}
                <TableRow>
                  <TableCell className="font-medium">20/06</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FaAmbulance className="size-4" />
                      Farmácia
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant="gray" size="md" shape="round">
                        Saúde
                      </Badge>
                      <Badge variant="gray" size="md" shape="round">
                        Saúde
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-red-700">- R$120,00</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="blue" size="sm">
                      <TbCircleCheck />
                      Confirmado
                    </Badge>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">20/06</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FaAmbulance className="size-4" />
                      Farmácia
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant="gray" size="md" shape="round">
                        Saúde
                      </Badge>
                      <Badge variant="gray" size="md" shape="round">
                        Saúde
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-red-700">- R$120,00</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="gray" size="sm">
                      <TbClock />
                      Pendente
                    </Badge>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">20/06</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FaAmbulance className="size-4" />
                      Farmácia
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant="gray" size="md" shape="round">
                        Saúde
                      </Badge>
                      <Badge variant="gray" size="md" shape="round">
                        Saúde
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-red-700">- R$120,00</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="blue" size="sm">
                      <TbCircleCheck />
                      Confirmado
                    </Badge>
                  </TableCell>
                </TableRow>
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={4}>Total</TableCell>
                  <TableCell className="text-right text-red-700">$2,500.00</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </CardContent>
        </Card>
      </div>
      <div className="col-span-3">
        <Card size="sm">
          <CardHeader>
            <CardTitle>Últimos lançamentos</CardTitle>
            <CardAction>
              <Button variant="ghost" size="sm">
                Ver todos
                <TbArrowRight className="size-4" />
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <Table>
              <TableCaption>Lista de despesas.</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-center w-0">Situação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[].map((invoice) => {
                  return null;
                  return (
                    <TableRow key={invoice.invoice}>
                      <TableCell className="font-medium">{invoice.invoice}</TableCell>
                      <TableCell>{invoice.paymentStatus}</TableCell>
                      <TableCell>{invoice.paymentMethod}</TableCell>
                      <TableCell className="text-right">{invoice.totalAmount}</TableCell>
                    </TableRow>
                  );
                })}
                <TableRow>
                  <TableCell className="font-medium">20/06</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FaAmbulance className="size-4" />
                      Farmácia
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant="gray" size="md" shape="round">
                        Saúde
                      </Badge>
                      <Badge variant="gray" size="md" shape="round">
                        Saúde
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-red-700">- R$120,00</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="blue" size="sm">
                      <TbCircleCheck />
                      Confirmado
                    </Badge>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">20/06</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FaAmbulance className="size-4" />
                      Farmácia
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant="gray" size="md" shape="round">
                        Saúde
                      </Badge>
                      <Badge variant="gray" size="md" shape="round">
                        Saúde
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-red-700">- R$120,00</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="gray" size="sm">
                      <TbClock />
                      Pendente
                    </Badge>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">20/06</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FaAmbulance className="size-4" />
                      Farmácia
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant="gray" size="md" shape="round">
                        Saúde
                      </Badge>
                      <Badge variant="gray" size="md" shape="round">
                        Saúde
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-red-700">- R$120,00</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="blue" size="sm">
                      <TbCircleCheck />
                      Confirmado
                    </Badge>
                  </TableCell>
                </TableRow>
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={4}>Total</TableCell>
                  <TableCell className="text-right text-red-700">$2,500.00</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </CardContent>
        </Card>
      </div>
      <FloatingActionButton />
    </main>
  );
}

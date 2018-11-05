#####################################################################
# File: HBplus.pm 
# Author: Brian Armstrong
# Modified: Sam Seaver (heavily)
#
# Comments:
#       Provides an interface for the HBplus program 
#
# Modified: 21 Oct 03

package HBplus;

use strict;
use PDB::Writer;

my $default_path = '/home/monster/execs/hbplus/whatif/';
my $config_file = $default_path.'hbplus.opt';
my $job;
my ($c1,$c2);
my $xml;
my $bonds;

my %water;

sub doHBplus{
    my $self=shift;
    my $pdb=shift;
    ($job,$c1,$c2,$xml,$bonds)=@_;

    %water=();
    $job = $job.$c1.$c2;
    get_hbonds($pdb);
}

sub get_hbonds{
    my $pdb = shift;
    
    my $hbpdb = $job.'.pdb';
    PDB::Writer->write('models'=>$pdb->getModel,'path'=>$hbpdb,'chains'=>[$c1,$c2],'pdb'=>$pdb,'xml'=>$xml, 'water'=>1, 'protons'=>'hbplus');
    my $hbout = $job.'.hb2';
    my $hblog = $job.'hb.log';
    
    my $hbplus = $default_path."hbplus_wi -f $config_file";
    
    qx "$hbplus $hbpdb 1>$hblog 2>&1";
    
    return undef unless -e "$hbout";
    
    read_hbonds($hbout,$pdb);
    report_errors($hblog, $xml);
    PDB::Writer->write('models'=>$pdb->getModel,'path'=>$hbpdb,'chains'=>[$c1,$c2],'pdb'=>$pdb,'xml'=>$xml, 'water'=>1, 'protons'=>'webmol');
}

sub read_hbonds{
    my ($file,$pdb) = @_;
    my( @results, @solvent_donors, @solvent_accs );
    
    open( HB, "<$file" ) || die "\ncouldn't open $file: $!";
    
    # first dump the 8-line header
    for( my $i=0; $i<8; $i++ ) { <HB>; }
    
    #$rn1/2 added to capture water for chain testing
    my ($c1,$c2,$r1,$r2,$rn1, $rn2, $a1,$a2,$b,$at1,$at2,$found,@info,$t);
    # now read in the interactions one at a time
    while( my $bond = <HB> ) {
	
	($c1,$r1,$rn1,$a1,$c2,$r2,$rn2,$a2,
	 @info) = unpack("A A4 x A3 x A3 x A A4 x A3 x A3 x A4 x14 A5 x A5 x A5 x A5",$bond);
	
	#
	if($rn1 eq 'HOH' && $c1 =~ /\d/){
	    $c1 =~ s/(\d)/-/;
	    $r1 = substr($r1, 1);
	    $r1 = $1.$r1;
	}
	if($rn2 eq 'HOH' && $c2 =~ /\d/){
	    $c2 =~ s/(\d)/-/;
	    $r2 = substr($r2, 1);
	    $r2 = $1.$r2;
	}
	
	
	# dump any intra-chain bonds
	next if $c1 eq $c2;
	
	$r1 = correct($r1);
	$r2 = correct($r2);
	
	$at1 = $pdb->getAtom($c1,$r1,$a1);
	$at2 = $pdb->getAtom($c2,$r2,$a2);
	
	unless($at1->water || $at2->water){
	    if(($at1->isAromatic && $at2->isAmine) || ($at1->isAmine && $at2->isAromatic)){$t = 'AMIARM'}
	    else{$t='HYBOND'}
	    $b = $bonds->newBond($at1,$at2,$pdb->getModel, $t);
	}else{
	    if($at1->water && !$at2->water){
		foreach my $atom (keys %{$water{$at1->currentChain.$at1->resNumber}}){
		    $found=1,next if $at2->atomNumber eq $water{$at1->currentChain.$at1->resNumber}{$atom}->atomNumber;
		    next if $water{$at1->currentChain.$at1->resNumber}{$atom}->currentChain eq $at2->currentChain;
		    $b = $bonds->newBond($water{$at1->currentChain.$at1->resNumber}{$atom},$at2,$pdb->getModel, 'H2OHYD');
		}
		$water{$at1->currentChain.$at1->resNumber}{$at2->atomNumber}=$at2 unless $found;
	    }elsif($at2->water && !$at1->water){
		foreach my $atom (keys %{$water{$at2->currentChain.$at2->resNumber}}){
		    $found=1,next if $at1->atomNumber eq $water{$at2->currentChain.$at2->resNumber}{$atom}->atomNumber;
		    next if $water{$at2->currentChain.$at2->resNumber}{$atom}->currentChain eq $at1->currentChain;
		    $b = $bonds->newBond($at1,$water{$at2->currentChain.$at2->resNumber}{$atom},$pdb->getModel, 'H2OHYD');
		}
		$water{$at2->currentChain.$at2->resNumber}{$at1->atomNumber}=$at1 unless $found;
	    }
	}
    }
    close(HB);
}

#assumption here is that errors come in the form of reporting a PDB line
#whose atom name HBplus doesnt recognise
sub report_errors{
    my ($file,$xml) = @_;
    
    open( HL, "<$file" ) || die "\ncouldn't open $file: $!";
    
    my $line;
    while(<HL>) {
	if($_ =~ /^ATOM/){
	    $line = new PDB::Atom('-line' => $_);
	    WebDBI->naming_error($xml,$line,'hbplus');
	}
    }
	close(HL);
}

#quick fix for errors
#1) if chain ID a number, take out zero in number (water only as of now)
#2) if residue number negative, unpack zeros
#
sub correct{
    my $name = shift;
    if($name =~ /^-/){
	$name = substr($name, 1);
	$name =~ s/^0*//;
	if ($name eq ''){$name='0'}
	return '-'.$name;
    }else{
	$name =~ s/^0*//;
	if ($name eq ''){$name='0'}
	return $name;
    }
}
1;